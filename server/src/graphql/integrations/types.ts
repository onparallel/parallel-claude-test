import { enumType, interfaceType, objectType } from "nexus";

export const IntegrationType = enumType({
  name: "IntegrationType",
  members: ["SIGNATURE", "SSO", "USER_PROVISIONING", "DOW_JONES_KYC"],
  description: "The types of integrations available.",
});

export const IOrgIntegration = interfaceType({
  name: "IOrgIntegration",
  definition(t) {
    t.globalId("id");
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
