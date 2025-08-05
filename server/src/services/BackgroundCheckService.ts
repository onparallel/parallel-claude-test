import { inject, injectable } from "inversify";
import { isNonNullish, isNullish } from "remeda";
import { Readable } from "stream";
import { assert } from "ts-essentials";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { BackgroundCheckProfileProps } from "../pdf/documents/BackgroundCheckProfile";
import { IPrinter, PRINTER } from "./Printer";
import { IRedis, REDIS } from "./Redis";
import {
  BACKGROUND_CHECK_CLIENT_FACTORY,
  BackgroundCheckClientFactory,
} from "./background-check-clients/BackgroundCheckClient";

export interface EntitySearchOptions {
  cutoff?: number;
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

interface EntityDetailsPdfResponse {
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
  ): Promise<EntityDetailsPdfResponse>;
  mapBackgroundCheckSearch(content: BackgroundCheckContent): EntitySearchResponse<true>;
  mapBackgroundCheckEntity(
    entity: EntityDetailsResponse,
    storedEntityId: string | null,
  ): EntityDetailsResponse<true>;
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
      cutoff: org.preferences["BACKGROUND_CHECK"]?.cutoff,
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
  ): Promise<EntityDetailsPdfResponse> {
    const stream = await this.printer.backgroundCheckProfile(userId, props);

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
}
