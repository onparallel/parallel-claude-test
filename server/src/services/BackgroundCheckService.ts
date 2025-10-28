import { inject, injectable } from "inversify";
import { difference, isNonNullish, isNullish } from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { BackgroundCheckProfileProps } from "../pdf/documents/BackgroundCheckProfileTypst";
import { BackgroundCheckResultsProps } from "../pdf/documents/BackgroundCheckResultsTypst";
import { IPrinter, PRINTER } from "./Printer";
import { IRedis, REDIS } from "./Redis";
import {
  BACKGROUND_CHECK_CLIENT_FACTORY,
  BackgroundCheckClientFactory,
} from "./background-check-clients/BackgroundCheckClient";

export interface EntitySearchOptions {
  threshold?: number;
}

export interface EntitySearchRequest {
  name: string;
  date?: string | null;
  country?: string | null;
  birthCountry?: string | null;
  type: "PERSON" | "COMPANY" | null;
}
export type EntitySearchPerson<ExtendedInfo extends boolean = false> = {
  id: string;
  type: "Person";
  name: string;
  score?: number;
  properties: {
    countryOfBirth?: string[];
    birthDate?: string[];
    gender?: string[];
    country?: string[];
    topics?: string[];
  };
} & (ExtendedInfo extends true ? { isFalsePositive: boolean; isMatch: boolean } : {});

export type EntitySearchCompany<ExtendedInfo extends boolean = false> = {
  id: string;
  type: "Company";
  name: string;
  score?: number;
  properties: {
    incorporationDate?: string[];
    jurisdiction?: string[];
    topics?: string[];
  };
} & (ExtendedInfo extends true ? { isFalsePositive: boolean; isMatch: boolean } : {});

export interface EntitySearchResponse<ExtendedInfo extends boolean = false> {
  totalCount: number;
  items: (EntitySearchPerson<ExtendedInfo> | EntitySearchCompany<ExtendedInfo>)[];
  createdAt: Date;
}

export interface EntityDetailsSanction {
  id: string;
  type: "Sanction";
  datasets?: { title: string }[];
  properties: {
    authority?: string[];
    program?: string[];
    startDate?: string[];
    endDate?: string[];
    sourceUrl?: string[];
  };
}

export interface EntityDetailsRelationship {
  id: string;
  type: "Associate" | "Family" | "Directorship";
  properties: {
    /**
     * `entityA` is `relationship` of `entityB`,
     */
    entityA?: EntityDetailsPerson | EntityDetailsCompany;
    relationship?: string[];
    entityB?: EntityDetailsPerson | EntityDetailsCompany;
    startDate?: string[];
    endDate?: string[];
  };
}

export interface DatasetDetails {
  name: string;
  title: string | null;
  summary: string | null;
  url: string | null;
}

export interface EntityDetailsPerson {
  id: string;
  type: "Person";
  name: string;
  properties: {
    gender?: string[];
    nationality?: string[];
    country?: string[];
    countryOfBirth?: string[];
    dateOfBirth?: string[];
    topics?: string[];
    name?: string[];
    alias?: string[];
    birthPlace?: string[];
    position?: string[];
    education?: string[];
    status?: string[];
    religion?: string[];
    ethnicity?: string[];
    sanctions?: EntityDetailsSanction[];
    relationships?: EntityDetailsRelationship[];
    sourceUrl?: string[];
  };
  datasets?: DatasetDetails[];
}

export interface EntityDetailsCompany {
  id: string;
  type: "Company";
  name: string;
  properties: {
    dateOfRegistration?: string[];
    topics?: string[];
    jurisdiction?: string[];
    name?: string[];
    alias?: string[];
    address?: string[];
    sanctions?: EntityDetailsSanction[];
    relationships?: EntityDetailsRelationship[];
    sourceUrl?: string[];
  };
  datasets?: DatasetDetails[];
}

export type EntityDetailsResponse<ExtendedInfo extends boolean = false> = (
  | EntityDetailsPerson
  | EntityDetailsCompany
) & {
  createdAt: Date;
} & (ExtendedInfo extends true ? { hasStoredEntity: boolean; isStoredEntity: boolean } : {});

interface PrintableDocumentResponse {
  mime_type: string;
  binary_stream: Readable;
}

export interface BackgroundCheckContent {
  query: EntitySearchRequest;
  search: EntitySearchResponse;
  entity: EntityDetailsResponse | null;
  /** IDs of the found entities that are marked as false positives */
  falsePositives?: { id: string; addedAt: Date; addedByUserId: number }[];
}

interface BackgroundCheckContentDifferences {
  search: {
    items?: {
      added: (EntitySearchPerson | EntitySearchCompany)[];
      removed: (EntitySearchPerson | EntitySearchCompany)[];
    };
  } | null;
  entity: {
    properties?: {
      topics?: {
        added: string[];
        removed: string[];
      };
      sanctions?: {
        added: EntityDetailsSanction[];
        removed: EntityDetailsSanction[];
      };
    };
  } | null;
}

export interface IBackgroundCheckService {
  entitySearch(query: EntitySearchRequest, orgId: number): Promise<EntitySearchResponse>;
  entityProfileDetails(
    entityId: string,
    userId?: number,
    opts?: { skipCache?: boolean },
  ): Promise<EntityDetailsResponse>;
  entityProfileDetailsPdf(
    userId: number,
    props: Omit<BackgroundCheckProfileProps, "assetsUrl">,
  ): Promise<PrintableDocumentResponse>;
  entitySearchResultsPdf(
    userId: number,
    props: Omit<BackgroundCheckResultsProps, "assetsUrl">,
  ): Promise<PrintableDocumentResponse>;
  mapBackgroundCheckSearch(content: BackgroundCheckContent): EntitySearchResponse<true>;
  mapBackgroundCheckEntity(
    entity: EntityDetailsResponse,
    storedEntityId: string | null,
  ): EntityDetailsResponse<true>;
  extractRelevantDifferences(
    before: BackgroundCheckContent,
    after: BackgroundCheckContent,
  ): BackgroundCheckContentDifferences;
  mergeReviewReasons(
    reviewReason: { differences: BackgroundCheckContentDifferences }[],
  ): BackgroundCheckContentDifferences;
}

export const BACKGROUND_CHECK_SERVICE = Symbol.for("BACKGROUND_CHECK_SERVICE");

@injectable()
export class BackgroundCheckService implements IBackgroundCheckService {
  constructor(
    @inject(PRINTER) private printer: IPrinter,
    @inject(REDIS) private redis: IRedis,
    @inject(BACKGROUND_CHECK_CLIENT_FACTORY)
    private backgroundCheckClientFactory: BackgroundCheckClientFactory,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
  ) {}

  private getClient() {
    return this.backgroundCheckClientFactory("OPEN_SANCTIONS");
  }

  async entitySearch(query: EntitySearchRequest, orgId: number): Promise<EntitySearchResponse> {
    const org = await this.organizations.loadOrg(orgId);
    assert(org, "Organization not found");

    return await this.getClient().entitySearch(query, {
      threshold: org.preferences["BACKGROUND_CHECK"]?.threshold,
    });
  }

  async entityProfileDetails(
    entityId: string,
    userId?: number,
    opts?: { skipCache?: boolean },
  ): Promise<EntityDetailsResponse> {
    if (isNullish(userId)) {
      return await this.getClient().entityProfileDetails(entityId);
    }

    // look inside Redis cache before making the API call
    const redisKey = `BackgroundCheck:${userId}:${entityId}`;
    if (!opts?.skipCache) {
      const redisCached = await this.redis.get(redisKey);
      if (redisCached) {
        return JSON.parse(redisCached) as EntityDetailsResponse;
      }
    }

    const details = await this.getClient().entityProfileDetails(entityId);
    await this.redis.set(redisKey, JSON.stringify(details), 60 * 60); // 1 hr cache

    return details;
  }

  async entityProfileDetailsPdf(
    userId: number,
    props: Omit<BackgroundCheckProfileProps, "assetsUrl">,
  ): Promise<PrintableDocumentResponse> {
    const stream = await this.printer.backgroundCheckProfile(userId, props);

    return {
      binary_stream: Readable.from(stream),
      mime_type: "application/pdf",
    };
  }

  async entitySearchResultsPdf(
    userId: number,
    props: Omit<BackgroundCheckResultsProps, "assetsUrl">,
  ): Promise<PrintableDocumentResponse> {
    const stream = await this.printer.backgroundCheckResults(userId, props);

    return {
      binary_stream: Readable.from(stream),
      mime_type: "application/pdf",
    };
  }

  public mapBackgroundCheckSearch(content: BackgroundCheckContent) {
    const falsePositiveIds = (content?.falsePositives ?? []).map(({ id }) => id);

    return {
      ...content.search,
      items: content.search.items.map((item) => ({
        ...item,
        isFalsePositive: falsePositiveIds.includes(item.id),
        isMatch: item.id === content.entity?.id,
      })),
    };
  }

  public mapBackgroundCheckEntity(entity: EntityDetailsResponse, storedEntityId: string | null) {
    return {
      ...entity,
      hasStoredEntity: isNonNullish(storedEntityId),
      isStoredEntity: storedEntityId === entity.id,
    };
  }

  public extractRelevantDifferences(before: BackgroundCheckContent, after: BackgroundCheckContent) {
    return {
      search: (() => {
        let searchDiff: BackgroundCheckContentDifferences["search"] | null = null;

        const itemsAdded = after.search.items.filter(
          (item) => !before.search.items.some((i) => i.id === item.id),
        );
        const itemsRemoved = before.search.items.filter(
          (item) => !after.search.items.some((i) => i.id === item.id),
        );

        if (itemsAdded.length > 0 || itemsRemoved.length > 0) {
          searchDiff ??= {
            items: {
              added: itemsAdded,
              removed: itemsRemoved,
            },
          };
        }

        return searchDiff;
      })(),
      entity: (() => {
        if (!before.entity || !after.entity) {
          return null;
        }

        assert(before.entity.id === after.entity.id, "Entities must have the same id");
        assert(before.entity.type === after.entity.type, "Entities must have the same type");

        let entityDiff: BackgroundCheckContentDifferences["entity"] | null = null;

        const topicsBefore = before.entity.properties.topics ?? [];
        const topicsAfter = after.entity.properties.topics ?? [];

        // Extract differences for Topics
        const topicsAdded = topicsAfter.filter((topic) => !topicsBefore.includes(topic));
        const topicsRemoved = topicsBefore.filter((topic) => !topicsAfter.includes(topic));

        if (topicsAdded.length > 0 || topicsRemoved.length > 0) {
          entityDiff ??= { properties: {} };
          entityDiff.properties!.topics = {
            added: topicsAdded,
            removed: topicsRemoved,
          };
        }

        const sanctionsBefore = before.entity.properties.sanctions ?? [];
        const sanctionsAfter = after.entity.properties.sanctions ?? [];

        // Extract differences for Sanctions
        const sanctionsBeforeIds = new Set(sanctionsBefore.map((sanction) => sanction.id));
        const sanctionsAfterIds = new Set(sanctionsAfter.map((sanction) => sanction.id));

        const sanctionsAdded = sanctionsAfter.filter(
          (sanction) => !sanctionsBeforeIds.has(sanction.id),
        );
        const sanctionsRemoved = sanctionsBefore.filter(
          (sanction) => !sanctionsAfterIds.has(sanction.id),
        );

        if (sanctionsAdded.length > 0 || sanctionsRemoved.length > 0) {
          entityDiff ??= { properties: {} };
          entityDiff.properties!.sanctions = {
            added: sanctionsAdded,
            removed: sanctionsRemoved,
          };
        }

        return entityDiff;
      })(),
    };
  }

  public mergeReviewReasons(reviewReason: { differences: BackgroundCheckContentDifferences }[]) {
    const differences = reviewReason.map(({ differences }) => differences);

    return {
      entity: (() => {
        // Extract all topics from all differences
        const allAddedTopics = differences.flatMap(
          (diff) => diff.entity?.properties?.topics?.added ?? [],
        );
        const allRemovedTopics = differences.flatMap(
          (diff) => diff.entity?.properties?.topics?.removed ?? [],
        );

        // Calculate final differences
        const finalTopicsDiff = {
          added: difference.multiset(allAddedTopics, allRemovedTopics),
          removed: difference.multiset(allRemovedTopics, allAddedTopics),
        };

        // Extract all sanctions from all differences
        const allAddedSanctions = differences.flatMap(
          (diff) => diff.entity?.properties?.sanctions?.added ?? [],
        );
        const allRemovedSanctions = differences.flatMap(
          (diff) => diff.entity?.properties?.sanctions?.removed ?? [],
        );

        // For sanctions, we need to handle by ID since they're objects
        const addedSanctionIds = new Set(allAddedSanctions.map((s) => s.id));
        const removedSanctionIds = new Set(allRemovedSanctions.map((s) => s.id));

        const finalSanctionsDiff = {
          added: allAddedSanctions.filter((s) => !removedSanctionIds.has(s.id)),
          removed: allRemovedSanctions.filter((s) => !addedSanctionIds.has(s.id)),
        };

        // Build properties object only if there are actual differences
        const properties: any = {};

        if (finalTopicsDiff.added.length > 0 || finalTopicsDiff.removed.length > 0) {
          properties.topics = finalTopicsDiff;
        }

        if (finalSanctionsDiff.added.length > 0 || finalSanctionsDiff.removed.length > 0) {
          properties.sanctions = finalSanctionsDiff;
        }

        return Object.keys(properties).length > 0 ? { properties } : null;
      })(),
      search: (() => {
        // Extract all items from all differences
        const allAddedItems = differences.flatMap((diff) => diff.search?.items?.added ?? []);
        const allRemovedItems = differences.flatMap((diff) => diff.search?.items?.removed ?? []);

        // For search items, we need to handle by ID since they're objects
        const addedItemIds = new Set(allAddedItems.map((s) => s.id));
        const removedItemIds = new Set(allRemovedItems.map((s) => s.id));

        const finalItemsDiff = {
          added: allAddedItems.filter((s) => !removedItemIds.has(s.id)),
          removed: allRemovedItems.filter((s) => !addedItemIds.has(s.id)),
        };

        // Build properties object only if there are actual differences
        const searchDiff: any = {};

        if (finalItemsDiff.added.length > 0 || finalItemsDiff.removed.length > 0) {
          searchDiff.items = finalItemsDiff;
        }

        return Object.keys(searchDiff).length > 0 ? searchDiff : null;
      })(),
    };
  }
}
