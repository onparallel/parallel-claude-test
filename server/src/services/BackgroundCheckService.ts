import { inject, injectable } from "inversify";
import { isNullish } from "remeda";
import { Readable } from "stream";
import { BackgroundCheckProfileProps } from "../pdf/documents/BackgroundCheckProfile";
import { IPrinter, PRINTER } from "./Printer";
import { IRedis, REDIS } from "./Redis";
import {
  BACKGROUND_CHECK_CLIENT_FACTORY,
  BackgroundCheckClientFactory,
} from "./background-check-clients/BackgroundCheckClient";

export interface EntitySearchRequest {
  name: string;
  date?: string | null;
  country?: string | null;
  birthCountry?: string | null;
  type: "PERSON" | "COMPANY" | null;
}
export interface EntitySearchPerson {
  id: string;
  type: "Person";
  name: string;
  score?: number;
  properties: {
    birthDate?: string[];
    gender?: string[];
    country?: string[];
    topics?: string[];
  };
}

export interface EntitySearchCompany {
  id: string;
  type: "Company";
  name: string;
  score?: number;
  properties: {
    incorporationDate?: string[];
    jurisdiction?: string[];
    topics?: string[];
  };
}

export interface EntitySearchResponse {
  totalCount: number;
  items: (EntitySearchPerson | EntitySearchCompany)[];
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
  };
  datasets?: DatasetDetails[];
}

export type EntityDetailsResponse = (EntityDetailsPerson | EntityDetailsCompany) & {
  createdAt: Date;
};

interface EntityDetailsPdfResponse {
  mime_type: string;
  binary_stream: Readable;
}

export interface IBackgroundCheckService {
  entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse>;
  entityProfileDetails(entityId: string, userId?: number): Promise<EntityDetailsResponse>;
  entityProfileDetailsPdf(
    userId: number,
    props: Omit<BackgroundCheckProfileProps, "assetsUrl">,
  ): Promise<EntityDetailsPdfResponse>;
}

export const BACKGROUND_CHECK_SERVICE = Symbol.for("BACKGROUND_CHECK_SERVICE");

@injectable()
export class BackgroundCheckService implements IBackgroundCheckService {
  constructor(
    @inject(PRINTER) private printer: IPrinter,
    @inject(REDIS) private redis: IRedis,
    @inject(BACKGROUND_CHECK_CLIENT_FACTORY)
    private backgroundCheckClientFactory: BackgroundCheckClientFactory,
  ) {}

  private getClient() {
    return this.backgroundCheckClientFactory("OPEN_SANCTIONS");
  }

  async entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse> {
    return await this.getClient().entitySearch(query);
  }

  async entityProfileDetails(entityId: string, userId?: number): Promise<EntityDetailsResponse> {
    if (isNullish(userId)) {
      return await this.getClient().entityProfileDetails(entityId);
    }

    // look inside Redis cache before making the API call
    const redisKey = `BackgroundCheck:${userId}:${entityId}`;
    const redisCached = await this.redis.get(redisKey);
    if (redisCached) {
      return JSON.parse(redisCached) as EntityDetailsResponse;
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
}
