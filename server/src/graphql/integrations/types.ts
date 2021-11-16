import { enumType, interfaceType, objectType } from "nexus";

export const IntegrationType = enumType({
  name: "IntegrationType",
  members: ["SIGNATURE", "SSO", "USER_PROVISIONING"],
  description: "The types of integrations available.",
});

export const OrgIntegration = interfaceType({
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
    t.boolean("isDefault", {
      description:
        "Wether this integration is the default to be used if the user has more than one of the same type",
      resolve: (o) => o.is_default,
    });
  },
  resolveType: (o) =>
    ((
      {
        SIGNATURE: "SignatureOrgIntegration",
        SSO: "SsoOrgIntegration",
        USER_PROVISIONING: "UserProvisioningOrgIntegration",
      } as const
    )[o.type]),
});

export const SignatureOrgIntegration = objectType({
  name: "SignatureOrgIntegration",
  definition(t) {
    t.implements("OrgIntegration");
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

export const UserProvisioningOrgIntegration = objectType({
  name: "UserProvisioningOrgIntegration",
  definition(t) {
    t.implements("OrgIntegration");
  },
  sourceType: "db.OrgIntegration",
});

export const SsoOrgIntegration = objectType({
  name: "SsoOrgIntegration",
  definition(t) {
    t.implements("OrgIntegration");
  },
  sourceType: "db.OrgIntegration",
});
