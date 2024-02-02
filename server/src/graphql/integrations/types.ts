import { enumType, interfaceType, objectType } from "nexus";
import { IntegrationTypeValues } from "../../db/__types";

export const IntegrationType = enumType({
  name: "IntegrationType",
  members: IntegrationTypeValues,
  description: "The types of integrations available.",
});

export const IOrgIntegration = interfaceType({
  name: "IOrgIntegration",
  definition(t) {
    t.globalId("id", { prefixName: "OrgIntegration" });
    t.string("name", {
      description: "Custom name of this integration, provided by the user",
    });
    t.field("type", {
      type: "IntegrationType",
      description: "The type of the integration.",
    });
    t.boolean("isDefault", {
      description:
        "Wether this integration is the default to be used if the user has more than one of the same type",
      resolve: (o) => o.is_default,
    });
    t.boolean("invalidCredentials", {
      resolve: (o) => o.invalid_credentials,
    });
  },
  resolveType: (o) => (o.type === "SIGNATURE" ? "SignatureOrgIntegration" : "OrgIntegration"),
});

export const SignatureOrgIntegration = objectType({
  name: "SignatureOrgIntegration",
  definition(t) {
    t.implements("IOrgIntegration");
    t.field("provider", {
      type: enumType({
        name: "SignatureOrgIntegrationProvider",
        members: ["SIGNATURIT", "DOCUSIGN"],
      }),
    });
    t.field("environment", {
      type: enumType({
        name: "SignatureOrgIntegrationEnvironment",
        members: ["DEMO", "PRODUCTION"],
      }),
      description:
        "Environment of this integration, to differentiate between sandbox and production-ready integrations",
      resolve: (o) => {
        return o.settings.ENVIRONMENT === "production" ? "PRODUCTION" : "DEMO";
      },
    });
  },
  sourceType: "db.OrgIntegration",
});

export const OrgIntegration = objectType({
  name: "OrgIntegration",
  definition(t) {
    t.implements("IOrgIntegration");
  },
  sourceType: "db.OrgIntegration",
});

export const BackgroundCheckEntitySearchPerson = objectType({
  name: "BackgroundCheckEntitySearchPerson",
  definition(t) {
    t.implements("BackgroundCheckEntitySearchSchema");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntitySearchPersonProperties",
        definition(t) {
          t.nullable.list.nonNull.string("birthDate");
          t.nullable.list.nonNull.string("gender");
          t.nullable.list.nonNull.string("country");
          t.nullable.list.nonNull.string("topics");
        },
      }),
    });
  },
});

export const BackgroundCheckEntitySearchCompany = objectType({
  name: "BackgroundCheckEntitySearchCompany",
  definition(t) {
    t.implements("BackgroundCheckEntitySearchSchema");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntitySearchCompanyProperties",
        definition(t) {
          t.nullable.list.nonNull.string("incorporationDate");
          t.nullable.list.nonNull.string("jurisdiction");
          t.nullable.list.nonNull.string("topics");
        },
      }),
    });
  },
});

export const BackgroundCheckEntitySearch = objectType({
  name: "BackgroundCheckEntitySearch",
  definition(t) {
    t.nonNull.int("totalCount");
    t.nonNull.list.nonNull.field("items", {
      type: interfaceType({
        name: "BackgroundCheckEntitySearchSchema",
        definition(t) {
          t.nonNull.string("id");
          t.nonNull.string("type");
          t.nonNull.string("name");
        },
        resolveType: (o) => {
          if (o.type === "Person") {
            return "BackgroundCheckEntitySearchPerson";
          } else if (o.type === "Company") {
            return "BackgroundCheckEntitySearchCompany";
          }
          throw new Error(`Unknown type ${o.type}`);
        },
      }),
    });
    t.nonNull.datetime("createdAt");
  },
});

export const BackgroundCheckEntitySearchType = enumType({
  name: "BackgroundCheckEntitySearchType",
  members: ["PERSON", "COMPANY"],
});

export const BackgroundCheckEntityDetailsSanction = objectType({
  name: "BackgroundCheckEntityDetailsSanction",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("type");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsSanctionProperties",
        definition(t) {
          t.nullable.list.nonNull.string("authority");
          t.nullable.list.nonNull.string("program");
          t.nullable.list.nonNull.string("startDate");
          t.nullable.list.nonNull.string("endDate");
          t.nullable.list.nonNull.string("sourceUrl");
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetailsRelationship = objectType({
  name: "BackgroundCheckEntityDetailsRelationship",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("type");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsRelationshipProperties",
        definition(t) {
          t.nullable.field("entityA", { type: "BackgroundCheckEntityDetails" });
          t.nullable.field("entityB", { type: "BackgroundCheckEntityDetails" });
          t.nullable.list.nonNull.string("relationship");
          t.nullable.list.nonNull.string("startDate");
          t.nullable.list.nonNull.string("endDate");
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetailsPerson = objectType({
  name: "BackgroundCheckEntityDetailsPerson",
  definition(t) {
    t.implements("BackgroundCheckEntityDetails");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsPersonProperties",
        definition(t) {
          t.nullable.list.nonNull.string("gender");
          t.nullable.list.nonNull.string("nationality");
          t.nullable.list.nonNull.string("country");
          t.nullable.list.nonNull.string("countryOfBirth");
          t.nullable.list.nonNull.string("dateOfBirth");
          t.nullable.list.nonNull.string("topics");
          t.nullable.list.nonNull.string("name");
          t.nullable.list.nonNull.string("alias");
          t.nullable.list.nonNull.string("birthPlace");
          t.nullable.list.nonNull.string("education");
          t.nullable.list.nonNull.string("ethnicity");
          t.nullable.list.nonNull.string("position");
          t.nullable.list.nonNull.string("status");
          t.nullable.list.nonNull.string("religion");
          t.nullable.list.nonNull.field("sanctions", {
            type: "BackgroundCheckEntityDetailsSanction",
          });
          t.nullable.list.nonNull.field("relationships", {
            type: "BackgroundCheckEntityDetailsRelationship",
          });
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetailsCompany = objectType({
  name: "BackgroundCheckEntityDetailsCompany",
  definition(t) {
    t.implements("BackgroundCheckEntityDetails");
    t.nonNull.field("properties", {
      type: objectType({
        name: "BackgroundCheckEntityDetailsCompanyProperties",
        definition(t) {
          t.nullable.list.nonNull.string("dateOfRegistration");
          t.nullable.list.nonNull.string("topics");
          t.nullable.list.nonNull.string("jurisdiction");
          t.nullable.list.nonNull.string("name");
          t.nullable.list.nonNull.string("alias");
          t.nullable.list.nonNull.string("address");
          t.nullable.list.nonNull.field("sanctions", {
            type: "BackgroundCheckEntityDetailsSanction",
          });
          t.nullable.list.nonNull.field("relationships", {
            type: "BackgroundCheckEntityDetailsRelationship",
          });
        },
      }),
    });
  },
});

export const BackgroundCheckEntityDetails = interfaceType({
  name: "BackgroundCheckEntityDetails",
  definition(t) {
    t.nonNull.string("id");
    t.nonNull.string("type");
    t.nonNull.string("name");
    t.nullable.datetime("createdAt");
  },
  resolveType: (o) => {
    if (o.type === "Person") {
      return "BackgroundCheckEntityDetailsPerson";
    } else if (o.type === "Company") {
      return "BackgroundCheckEntityDetailsCompany";
    }
    throw new Error(`Unknown type ${o.type}`);
  },
});

/** @deprecated */
export const DowJonesKycEntityType = enumType({
  name: "DowJonesKycEntityType",
  members: ["Person", "Entity"],
});

/** @deprecated */
export const DowJonesKycEntityPlace = objectType({
  name: "DowJonesKycEntityPlace",
  definition(t) {
    t.string("descriptor");
    t.string("countryCode");
  },
});

/** @deprecated */
export const DowJonesKycEntityDate = objectType({
  name: "DowJonesKycEntityDate",
  definition(t) {
    t.nullable.int("year");
    t.nullable.int("month");
    t.nullable.int("day");
  },
});

/** @deprecated */
export const DowJonesKycEntitySanction = objectType({
  name: "DowJonesKycEntitySanction",
  definition(t) {
    t.id("id");
    t.string("name");
    t.list.string("sources");
    t.nullable.field("fromDate", { type: "DowJonesKycEntityDate" });
  },
});

/** @deprecated */
export const DowJonesKycEntityRelationship = objectType({
  name: "DowJonesKycEntityRelationship",
  definition(t) {
    t.id("profileId");
    t.string("connectionType");
    t.list.string("iconHints");
    t.nullable.string("name");
    t.field("type", { type: "DowJonesKycEntityType" });
  },
});

/** @deprecated */
export const DowJonesKycEntitySearchResult = interfaceType({
  name: "DowJonesKycEntitySearchResult",
  definition(t) {
    t.id("id");
    t.id("profileId");
    t.field("type", { type: "DowJonesKycEntityType" });
    t.string("name");
    t.string("title");
    t.nullable.string("countryTerritoryName");
    t.boolean("isSubsidiary");
    t.list.string("iconHints");
  },
  resolveType: (o) =>
    o.type === "Person"
      ? "DowJonesKycEntitySearchResultPerson"
      : "DowJonesKycEntitySearchResultEntity",
});

/** @deprecated */
export const DowJonesKycEntitySearchResultPerson = objectType({
  name: "DowJonesKycEntitySearchResultPerson",
  definition(t) {
    t.implements("DowJonesKycEntitySearchResult");
    t.string("gender");
    t.nullable.field("dateOfBirth", { type: "DowJonesKycEntityDate" });
  },
});

/** @deprecated */
export const DowJonesKycEntitySearchResultEntity = objectType({
  name: "DowJonesKycEntitySearchResultEntity",
  definition(t) {
    t.implements("DowJonesKycEntitySearchResult");
  },
});

/** @deprecated */
export const DowJonesKycEntityProfileResult = interfaceType({
  name: "DowJonesKycEntityProfileResult",
  definition(t) {
    t.id("id");
    t.id("profileId");
    t.field("type", { type: "DowJonesKycEntityType" });
    t.string("name");
    t.list.string("iconHints");
    t.list.field("sanctions", {
      type: "DowJonesKycEntitySanction",
    });
    t.list.field("relationships", {
      type: "DowJonesKycEntityRelationship",
    });
    t.datetime("updatedAt");
  },
  resolveType: (o) =>
    o.type === "Person"
      ? "DowJonesKycEntityProfileResultPerson"
      : "DowJonesKycEntityProfileResultEntity",
});

/** @deprecated */
export const DowJonesKycEntityProfileResultPerson = objectType({
  name: "DowJonesKycEntityProfileResultPerson",
  definition(t) {
    t.implements("DowJonesKycEntityProfileResult");
    t.nullable.field("placeOfBirth", { type: "DowJonesKycEntityPlace" });
    t.nullable.field("dateOfBirth", { type: "DowJonesKycEntityDate" });
    t.nullable.field("citizenship", { type: "DowJonesKycEntityPlace" });
    t.nullable.field("residence", { type: "DowJonesKycEntityPlace" });
    t.nullable.field("jurisdiction", { type: "DowJonesKycEntityPlace" });
    t.boolean("isDeceased");
  },
});

/** @deprecated */
export const DowJonesKycEntityProfileResultEntity = objectType({
  name: "DowJonesKycEntityProfileResultEntity",
  definition(t) {
    t.implements("DowJonesKycEntityProfileResult");
    t.nullable.field("dateOfRegistration", { type: "DowJonesKycEntityDate" });
  },
});
