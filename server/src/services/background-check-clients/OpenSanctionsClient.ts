import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../../config";
import { FETCH_SERVICE, FetchService } from "../FetchService";
import {
  EntityDetailsCompany,
  EntityDetailsPerson,
  EntityDetailsRelationship,
  EntityDetailsResponse,
  EntityDetailsSanction,
  EntitySearchCompany,
  EntitySearchPerson,
  EntitySearchRequest,
  EntitySearchResponse,
  IBackgroundCheckClient,
} from "./BackgroundCheckClient";

interface OpenSanctionsPersonSchema {
  id: string;
  caption: string;
  schema: "Person";
  properties: {
    alias?: string[];
    name?: string[];
    nationality?: string[];
    birthDate?: string[];
    topics?: string[];
    position?: string[];
    status?: string[];
    gender?: string[];
    country?: string[];
    birthPlace?: string[];
    education?: string[];
    ethnicity?: string[];
    religion?: string[];
    associations?: OpenSanctionsAssociationSchema[];
    associates?: OpenSanctionsAssociateSchema[];
    familyRelative?: OpenSanctionsFamilyRelativeSchema[];
    familyPerson?: OpenSanctionsFamilyPersonSchema[];
    directorshipDirector?: OpenSanctionsDirectorshipDirectorSchema[];
    sanctions?: OpenSanctionsSanctionSchema[];
  };
}

interface OpenSanctionsAssociationSchema {
  id: string;
  caption: string;
  schema: "Associate";
  properties: {
    startDate?: string[];
    endDate?: string[];
    relationship?: string[];
    associate?: string[];
    person: OpenSanctionsPersonSchema[];
  };
}

interface OpenSanctionsAssociateSchema {
  id: string;
  caption: string;
  schema: "Associate";
  properties: {
    startDate?: string[];
    endDate?: string[];
    relationship?: string[];
    associate: OpenSanctionsPersonSchema[];
    person?: string[];
  };
}

interface OpenSanctionsFamilyRelativeSchema {
  id: string;
  caption: string;
  schema: "Family";
  properties: {
    startDate?: string[];
    endDate?: string[];
    person: OpenSanctionsPersonSchema[];
    relationship?: string[];
    relative?: string[];
  };
}

interface OpenSanctionsFamilyPersonSchema {
  id: string;
  caption: string;
  schema: "Family";
  properties: {
    startDate?: string[];
    endDate?: string[];
    person?: string[];
    relationship?: string[];
    relative: OpenSanctionsPersonSchema[];
  };
}

interface OpenSanctionsSanctionSchema {
  id: string;
  caption: string;
  schema: "Sanction";
  properties: {
    authority?: string[];
    program?: string[];
    startDate?: string[];
    endDate?: string[];
    sourceUrl?: string[];
  };
}

interface OpenSanctionsCompanySchema {
  id: string;
  caption: string;
  schema: "Company" | "Organization";
  properties: {
    name?: string[];
    alias?: string[];
    address?: string[];
    incorporationDate?: string[];
    jurisdiction?: string[];
    topics?: string[];
    registrationNumber?: string[];
    sanctions?: OpenSanctionsSanctionSchema[];
    directorshipOrganization?: OpenSanctionsDirectorshipOrganizationSchema[];
  };
}

interface OpenSanctionsDirectorshipDirectorSchema {
  id: string;
  caption: string;
  schema: "Directorship";
  properties: {
    director?: string[];
    organization: OpenSanctionsCompanySchema[];
    role?: string[];
    startDate?: string[];
    endDate?: string[];
  };
}
interface OpenSanctionsDirectorshipOrganizationSchema {
  id: string;
  caption: string;
  schema: "Directorship";
  properties: {
    director: (OpenSanctionsPersonSchema | OpenSanctionsCompanySchema)[];
    organization?: string[];
    role?: string[];
    startDate?: string[];
    endDate?: string[];
  };
}

interface OpenSanctionsMatchResponse {
  responses: Record<
    string,
    {
      status: number;
      results: any[];
    }
  >;
}

type OpenSanctionsEntityDetailsResponse = OpenSanctionsPersonSchema | OpenSanctionsCompanySchema;

@injectable()
export class OpenSanctionsClient implements IBackgroundCheckClient {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(FETCH_SERVICE) private fetch: FetchService,
  ) {}

  private async apiCall<TResult>(method: string, uri: string, body?: any): Promise<TResult> {
    const response = await this.fetch.fetch(`${this.config.openSanctions.yenteUrl}/${uri}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.config.openSanctions.yenteUsername}:${this.config.openSanctions.yentePassword}`,
        ).toString("base64")}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      throw new Error("PROFILE_NOT_FOUND");
    } else if (response.status === 401) {
      throw new Error("INVALID_CREDENTIALS");
    }

    throw new Error(`OpenSanctions API call failed: ${response.status} ${response.statusText}`);
  }

  async entitySearch(query: EntitySearchRequest): Promise<EntitySearchResponse> {
    const queries: Record<string, any> = {};
    if (!query.type || query.type === "PERSON") {
      queries.person = {
        schema: "Person",
        properties: {
          name: [query.name],
          ...(query.date ? { birthDate: [query.date] } : {}),
          ...(query.country ? { nationality: [query.country.toLowerCase()] } : {}),
        },
      };
    }
    if (!query.type || query.type === "COMPANY") {
      queries.company = {
        schema: "Company",
        properties: {
          name: [query.name],
          ...(query.date ? { incorporationDate: [query.date] } : {}),
          ...(query.country ? { jurisdiction: [query.country.toLowerCase()] } : {}),
        },
      };
    }
    const data = await this.apiCall<OpenSanctionsMatchResponse>("POST", "match/default", {
      queries,
    });

    const items: EntitySearchResponse["items"] = [];

    const persons = data.responses.person;
    if (persons?.status === 200) {
      items.push(...persons.results.filter(this.isPersonSchema).map(this.mapPersonSearch));
    }

    const companies = data.responses.company;
    if (companies?.status === 200) {
      items.push(...companies.results.filter(this.isCompanySchema).map(this.mapCompanySearch));
    }

    return { totalCount: items.length, items, createdAt: new Date() };
  }

  async entityProfileDetails(entityId: string): Promise<EntityDetailsResponse> {
    const data = await this.apiCall<OpenSanctionsEntityDetailsResponse>(
      "GET",
      `entities/${entityId}`,
    );

    switch (data.schema) {
      case "Person":
        return this.personDetails(data as OpenSanctionsPersonSchema);
      case "Company":
      case "Organization":
        return this.companyDetails(data as OpenSanctionsCompanySchema);
      default:
        throw new Error("INVALID_ENTITY_SCHEMA");
    }
  }

  private mapPersonSearch(data: OpenSanctionsPersonSchema): EntitySearchPerson {
    return {
      id: data.id,
      type: "Person",
      name: data.caption,
      properties: {
        birthDate: data.properties.birthDate,
        gender: data.properties.gender,
        country: data.properties.country,
        topics: data.properties.topics,
      },
    };
  }

  private mapCompanySearch(data: OpenSanctionsCompanySchema): EntitySearchCompany {
    return {
      id: data.id,
      type: "Company",
      name: data.caption,
      properties: {
        incorporationDate: data.properties.incorporationDate,
        jurisdiction: data.properties.jurisdiction,
        topics: data.properties.topics,
      },
    };
  }

  private personDetails(data: OpenSanctionsPersonSchema): EntityDetailsResponse {
    const person = {
      id: data.id,
      type: "Person",
      name: data.caption,
      properties: {},
    } as EntityDetailsPerson;

    return {
      ...person,
      properties: {
        country: data.properties.country,
        countryOfBirth: data.properties.birthPlace,
        dateOfBirth: data.properties.birthDate,
        gender: data.properties.gender,
        nationality: data.properties.nationality,
        topics: data.properties.topics,
        alias: data.properties.alias,
        name: data.properties.name,
        birthPlace: data.properties.birthPlace,
        education: data.properties.education,
        ethnicity: data.properties.ethnicity,
        position: data.properties.position,
        status: data.properties.status,
        religion: data.properties.religion,
        relationships: [
          ...(data.properties.familyPerson ?? [])
            .filter(this.isFamilyPersonSchema)
            .map(this.mapFamilyPerson(person)),
          ...(data.properties.familyRelative ?? [])
            .filter(this.isFamilyRelativeSchema)
            .map(this.mapFamilyRelative(person)),
          ...(data.properties.associates ?? [])
            .filter(this.isAssociateSchema)
            .map(this.mapAssociate(person)),
          ...(data.properties.associations ?? [])
            .filter(this.isAssociationSchema)
            .map(this.mapAssociation(person)),
          ...(data.properties.directorshipDirector ?? [])
            .filter(this.isDirectorshipDirectorSchema)
            .map(this.mapDirectorshipDirector(person)),
        ],
        sanctions: (data.properties.sanctions ?? [])
          .filter(this.isSanctionSchema)
          .map(this.mapSanction),
      },
      createdAt: new Date(),
    };
  }

  private companyDetails(data: OpenSanctionsCompanySchema): EntityDetailsResponse {
    const company = {
      id: data.id,
      type: "Company",
      name: data.caption,
      properties: {},
    } as EntityDetailsCompany;
    return {
      ...company,
      properties: {
        dateOfRegistration: data.properties.incorporationDate,
        topics: data.properties.topics,
        jurisdiction: data.properties.jurisdiction,
        name: data.properties.name,
        alias: data.properties.alias,
        address: data.properties.address,
        relationships: [
          ...(data.properties.directorshipOrganization ?? [])
            .filter(this.isDirectorShipOrganizationSchema)
            .map(this.mapDirectorshipOrganization(company)),
        ],
        sanctions: (data.properties.sanctions ?? [])
          .filter(this.isSanctionSchema)
          .map(this.mapSanction),
      },
      createdAt: new Date(),
    };
  }

  private isPersonSchema(e: any): e is OpenSanctionsPersonSchema {
    return e?.schema === "Person";
  }

  private isCompanySchema(e: any): e is OpenSanctionsCompanySchema {
    return e?.schema === "Company";
  }

  private isAssociateSchema(e: any): e is OpenSanctionsAssociateSchema {
    return e?.schema === "Associate" && e?.properties?.associate?.[0]?.schema === "Person";
  }

  private isAssociationSchema(e: any): e is OpenSanctionsAssociationSchema {
    return e?.schema === "Associate" && e?.properties?.person?.[0]?.schema === "Person";
  }

  private isFamilyRelativeSchema(e: any): e is OpenSanctionsFamilyRelativeSchema {
    return e?.schema === "Family" && e?.properties?.person?.[0]?.schema === "Person";
  }

  private isFamilyPersonSchema(e: any): e is OpenSanctionsFamilyPersonSchema {
    return e?.schema === "Family" && e?.properties?.relative?.[0]?.schema === "Person";
  }

  private isSanctionSchema(e: any): e is OpenSanctionsSanctionSchema {
    return e?.schema === "Sanction";
  }

  private isDirectorshipDirectorSchema(e: any): e is OpenSanctionsDirectorshipDirectorSchema {
    return (
      e?.schema === "Directorship" &&
      (e.properties?.organization?.[0]?.schema === "Company" ||
        e.properties?.organization?.[0]?.schema === "Organization")
    );
  }

  private isDirectorShipOrganizationSchema(
    e: any,
  ): e is OpenSanctionsDirectorshipOrganizationSchema {
    return (
      e?.schema === "Directorship" &&
      (e.properties?.director?.[0]?.schema === "Person" ||
        e.properties?.director?.[0]?.schema === "Company" ||
        e.properties?.director?.[0]?.schema === "Organization")
    );
  }

  private mapAssociate(person: EntityDetailsPerson) {
    return (data: OpenSanctionsAssociateSchema): EntityDetailsRelationship => ({
      id: data.id,
      type: "Associate",
      properties: {
        entityA: {
          id: data.properties.associate[0].id,
          type: "Person",
          name: data.properties.associate[0].caption,
          properties: {},
        },
        entityB: person,
        relationship: data.properties.relationship,
        startDate: data.properties.startDate,
        endDate: data.properties.endDate,
      },
    });
  }

  private mapAssociation(person: EntityDetailsPerson) {
    return (data: OpenSanctionsAssociationSchema): EntityDetailsRelationship => ({
      id: data.id,
      type: "Associate",
      properties: {
        entityA: person,
        entityB: {
          id: data.properties.person[0].id,
          type: "Person",
          name: data.properties.person[0].caption,
          properties: {},
        },
        relationship: data.properties.relationship,
        startDate: data.properties.startDate,
        endDate: data.properties.endDate,
      },
    });
  }

  private mapFamilyRelative(person: EntityDetailsPerson) {
    return (data: OpenSanctionsFamilyRelativeSchema): EntityDetailsRelationship => ({
      id: data.id,
      type: "Family",
      properties: {
        entityA: person,
        entityB: {
          id: data.properties.person[0].id,
          type: "Person",
          name: data.properties.person[0].caption,
          properties: {},
        },
        relationship: data.properties.relationship,
        startDate: data.properties.startDate,
        endDate: data.properties.endDate,
      },
    });
  }

  private mapFamilyPerson(person: EntityDetailsPerson) {
    return (data: OpenSanctionsFamilyPersonSchema): EntityDetailsRelationship => ({
      id: data.id,
      type: "Family",
      properties: {
        entityA: {
          id: data.properties.relative[0].id,
          type: "Person",
          name: data.properties.relative[0].caption,
          properties: {},
        },
        entityB: person,
        relationship: data.properties.relationship,
        startDate: data.properties.startDate,
        endDate: data.properties.endDate,
      },
    });
  }

  private mapDirectorshipDirector(person: EntityDetailsPerson) {
    return (data: OpenSanctionsDirectorshipDirectorSchema): EntityDetailsRelationship => ({
      id: data.id,
      type: "Directorship",
      properties: {
        entityA: person,
        entityB: {
          id: data.properties.organization[0].id,
          type: "Company",
          name: data.properties.organization[0].caption,
          properties: {},
        },
        relationship: data.properties.role,
        startDate: data.properties.startDate,
        endDate: data.properties.endDate,
      },
    });
  }

  private mapDirectorshipOrganization(company: EntityDetailsCompany) {
    return (data: OpenSanctionsDirectorshipOrganizationSchema): EntityDetailsRelationship => ({
      id: data.id,
      type: "Directorship",
      properties: {
        entityA: {
          id: data.properties.director[0].id,
          type: data.properties.director[0].schema === "Person" ? "Person" : "Company",
          name: data.properties.director[0].caption,
          properties: {},
        },
        entityB: company,
        relationship: data.properties.role,
        startDate: data.properties.startDate,
        endDate: data.properties.endDate,
      },
    });
  }

  private mapSanction(data: OpenSanctionsSanctionSchema): EntityDetailsSanction {
    return {
      id: data.id,
      type: "Sanction",
      properties: {
        authority: data.properties.authority,
        program: data.properties.program,
        startDate: data.properties.startDate,
        endDate: data.properties.endDate,
        sourceUrl: data.properties.sourceUrl,
      },
    };
  }
}
