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
  },
  resolveType: (o) => (o.type === "SIGNATURE" ? "SignatureOrgIntegration" : "OrgIntegration"),
});

export const SignatureOrgIntegration = objectType({
  name: "SignatureOrgIntegration",
  definition(t) {
    t.implements("IOrgIntegration");
    t.field("provider", {
      type: enumType({ name: "SignatureOrgIntegrationProvider", members: ["SIGNATURIT"] }),
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

export const DowJonesRiskEntityType = enumType({
  name: "DowJonesRiskEntityType",
  members: ["Person", "Entity"],
});

export const DowJonesRiskEntityPlace = objectType({
  name: "DowJonesRiskEntityPlace",
  definition(t) {
    t.string("descriptor");
    t.string("countryCode");
  },
});

export const DowJonesRiskEntityDate = objectType({
  name: "DowJonesRiskEntityDate",
  definition(t) {
    t.nullable.int("year");
    t.nullable.int("month");
    t.nullable.int("day");
  },
});

export const DowJonesRiskEntitySanction = objectType({
  name: "DowJonesRiskEntitySanction",
  definition(t) {
    t.string("name");
    t.list.string("sources");
    t.field("fromDate", { type: "DowJonesRiskEntityDate" });
  },
});

export const DowJonesRiskEntityRelationship = objectType({
  name: "DowJonesRiskEntityRelationship",
  definition(t) {
    t.int("profileId");
    t.string("connectionType");
    t.list.string("iconHints");
    t.nullable.string("name");
    t.field("type", { type: "DowJonesRiskEntityType" });
  },
});

export const DowJonesRiskEntitySearchResult = interfaceType({
  name: "DowJonesRiskEntitySearchResult",
  definition(t) {
    t.id("id");
    t.field("type", { type: "DowJonesRiskEntityType" });
    t.string("name");
    t.string("title");
    t.string("countryTerritoryName");
    t.boolean("isSubsidiary");
    t.list.string("iconHints");
  },
  resolveType: (o) =>
    o.type === "Person"
      ? "DowJonesRiskEntitySearchResultPerson"
      : "DowJonesRiskEntitySearchResultEntity",
});

export const DowJonesRiskEntitySearchResultPerson = objectType({
  name: "DowJonesRiskEntitySearchResultPerson",
  definition(t) {
    t.implements("DowJonesRiskEntitySearchResult");
    t.string("gender");
    t.nullable.field("dateOfBirth", { type: "DowJonesRiskEntityDate" });
  },
});

export const DowJonesRiskEntitySearchResultEntity = objectType({
  name: "DowJonesRiskEntitySearchResultEntity",
  definition(t) {
    t.implements("DowJonesRiskEntitySearchResult");
  },
});

export const DowJonesRiskEntityProfileResult = interfaceType({
  name: "DowJonesRiskEntityProfileResult",
  definition(t) {
    t.id("id");
    t.field("type", { type: "DowJonesRiskEntityType" });
    t.string("name");
    t.list.string("iconHints");
    t.list.field("sanctions", {
      type: "DowJonesRiskEntitySanction",
    });
    t.list.field("relationships", {
      type: "DowJonesRiskEntityRelationship",
    });
  },
  resolveType: (o) =>
    o.type === "Person"
      ? "DowJonesRiskEntityProfileResultPerson"
      : "DowJonesRiskEntityProfileResultEntity",
});

export const DowJonesRiskEntityProfileResultPerson = objectType({
  name: "DowJonesRiskEntityProfileResultPerson",
  definition(t) {
    t.implements("DowJonesRiskEntityProfileResult");
    t.nullable.field("placeOfBirth", { type: "DowJonesRiskEntityPlace" });
    t.nullable.field("dateOfBirth", { type: "DowJonesRiskEntityDate" });
    t.nullable.field("citizenship", { type: "DowJonesRiskEntityPlace" });
    t.nullable.field("residence", { type: "DowJonesRiskEntityPlace" });
    t.nullable.field("jurisdiction", { type: "DowJonesRiskEntityPlace" });
    t.boolean("isDeceased");
  },
});

export const DowJonesRiskEntityProfileResultEntity = objectType({
  name: "DowJonesRiskEntityProfileResultEntity",
  definition(t) {
    t.implements("DowJonesRiskEntityProfileResult");
    t.nullable.field("dateOfRegistration", { type: "DowJonesRiskEntityDate" });
  },
});
