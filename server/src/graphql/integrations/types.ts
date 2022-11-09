import { enumType, interfaceType, objectType } from "nexus";

export const IntegrationType = enumType({
  name: "IntegrationType",
  members: ["SIGNATURE", "SSO", "USER_PROVISIONING", "DOW_JONES_KYC"],
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
    t.nullable.string("consentRequiredUrl", {
      resolve: (o) => (o.settings.CONSENT_REQUIRED && o.settings.CONSENT_URL) ?? null,
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

export const DowJonesKycEntityType = enumType({
  name: "DowJonesKycEntityType",
  members: ["Person", "Entity"],
});

export const DowJonesKycEntityPlace = objectType({
  name: "DowJonesKycEntityPlace",
  definition(t) {
    t.string("descriptor");
    t.string("countryCode");
  },
});

export const DowJonesKycEntityDate = objectType({
  name: "DowJonesKycEntityDate",
  definition(t) {
    t.nullable.int("year");
    t.nullable.int("month");
    t.nullable.int("day");
  },
});

export const DowJonesKycEntitySanction = objectType({
  name: "DowJonesKycEntitySanction",
  definition(t) {
    t.id("id");
    t.string("name");
    t.list.string("sources");
    t.nullable.field("fromDate", { type: "DowJonesKycEntityDate" });
  },
});

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

export const DowJonesKycEntitySearchResultPerson = objectType({
  name: "DowJonesKycEntitySearchResultPerson",
  definition(t) {
    t.implements("DowJonesKycEntitySearchResult");
    t.string("gender");
    t.nullable.field("dateOfBirth", { type: "DowJonesKycEntityDate" });
  },
});

export const DowJonesKycEntitySearchResultEntity = objectType({
  name: "DowJonesKycEntitySearchResultEntity",
  definition(t) {
    t.implements("DowJonesKycEntitySearchResult");
  },
});

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

export const DowJonesKycEntityProfileResultEntity = objectType({
  name: "DowJonesKycEntityProfileResultEntity",
  definition(t) {
    t.implements("DowJonesKycEntityProfileResult");
    t.nullable.field("dateOfRegistration", { type: "DowJonesKycEntityDate" });
  },
});
