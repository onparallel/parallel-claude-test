import { ResolutionContext } from "inversify";

export const BACKGROUND_CHECK_CLIENT = Symbol.for("BACKGROUND_CHECK_CLIENT");

export interface EntitySearchRequest {
  name: string;
  date?: string | null;
  country?: string | null;
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
}

export type EntityDetailsResponse = (EntityDetailsPerson | EntityDetailsCompany) & {
  createdAt: Date;
};

export interface IBackgroundCheckClient {
  entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse>;
  entityProfileDetails(entityId: string): Promise<EntityDetailsResponse>;
}

export const BACKGROUND_CHECK_CLIENT_FACTORY = Symbol.for("BACKGROUND_CHECK_CLIENT_FACTORY");

export function getBackgroundCheckClientFactory(context: ResolutionContext) {
  return function backgroundCheckClientFactory(provider: "OPEN_SANCTIONS"): IBackgroundCheckClient {
    return context.get<IBackgroundCheckClient>(BACKGROUND_CHECK_CLIENT, {
      name: provider,
    });
  };
}

export type BackgroundCheckClientFactory = ReturnType<typeof getBackgroundCheckClientFactory>;
