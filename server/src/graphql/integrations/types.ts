import { enumType, objectType } from "nexus";

export const IntegrationType = enumType({
  name: "IntegrationType",
  members: ["SIGNATURE", "SSO", "USER_PROVISIONING"],
  description: "The types of integrations available.",
});

export const OrgIntegrationStatus = enumType({
  name: "OrgIntegrationStatus",
  members: ["DEMO", "PRODUCTION"],
});

export const OrgIntegration = objectType({
  name: "OrgIntegration",
  definition(t) {
    t.globalId("id");
    t.string("name", {
      description: "Custom name of this integration, provided by the user",
    });
    t.field("type", {
      type: "IntegrationType",
      description: "The type of the integration.",
    });
    t.string("provider", {
      description: "The provider used for this integration.",
    });
    t.boolean("isDefault", {
      description:
        "Wether this integration is the default to be used if the user has more than one of the same type",
      resolve: (o) => o.is_default,
    });
    t.field("status", {
      type: "OrgIntegrationStatus",
      description:
        "Status of this integration, to differentiate between sandbox and production-ready integrations",
      resolve: (o) => {
        return o.settings.ENVIRONMENT === "production" ? "PRODUCTION" : "DEMO";
      },
    });
  },
});
