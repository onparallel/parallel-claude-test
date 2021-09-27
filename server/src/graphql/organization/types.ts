import { arg, booleanArg, enumType, list, nonNull, objectType } from "nexus";
import { titleize } from "../../util/strings";
import { userIsSuperAdmin } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { isOwnOrgOrSuperAdmin } from "./authorizers";

export const OrganizationStatus = enumType({
  name: "OrganizationStatus",
  members: [
    { name: "DEV", description: "Used for development or testing purposes" },
    { name: "DEMO", description: "Used for demoing the product" },
    { name: "ACTIVE", description: "Used for regular clients" },
    { name: "CHURNED", description: "Used on churned clients" },
    { name: "ROOT", description: "Root client" },
  ],
  description: "The status of the organization.",
});

export const IntegrationType = enumType({
  name: "IntegrationType",
  members: ["SIGNATURE"],
  description: "The types of integrations available.",
});

export const OrgIntegration = objectType({
  name: "OrgIntegration",
  definition(t) {
    t.string("name", {
      description: "The name of the integration.",
      resolve: (o) => titleize(o.provider),
    });
    t.field("type", {
      type: "IntegrationType",
      description: "The type of the integration.",
    });
    t.string("provider", {
      description: "The provider used for this integration.",
    });
  },
});

export const Organization = objectType({
  name: "Organization",
  description: "An organization in the system.",
  definition(t) {
    t.implements("Timestamps");
    t.int("_id", {
      deprecation: "Temporal solution for support methods, don't use",
      authorize: userIsSuperAdmin(),
      resolve: ({ id }) => id,
    });
    t.globalId("id", {
      description: "The ID of the organization.",
    });
    t.string("name", {
      description: "The name of the organization.",
    });
    t.nullable.string("logoUrl", {
      description: "URL of the organization logo",
      resolve: async (root, args, ctx) => {
        return ctx.organizations.getOrgLogoUrl(root.id);
      },
    });
    t.field("status", {
      type: "OrganizationStatus",
      description: "The status of the organization.",
      authorize: isOwnOrgOrSuperAdmin(),
    });
    t.boolean("hasSsoProvider", {
      description: "Whether the organization has an SSO provider configured.",
      resolve: async (o, _, ctx) => {
        const integrations = await ctx.integrations.loadEnabledIntegrationsForOrgId(o.id);
        return integrations.some((i) => i.type === "SSO");
      },
    });
    t.int("userCount", {
      description: "The total number of users",
      authorize: isOwnOrgOrSuperAdmin(),
      resolve: async (root, _, ctx) => await ctx.organizations.loadUserCount(root.id),
    });
    t.paginationField("users", {
      type: "User",
      description: "The users in the organization.",
      searchable: true,
      sortableBy: ["firstName", "lastName", "fullName", "email", "createdAt", "lastActiveAt"],
      authorize: isOwnOrgOrSuperAdmin(),
      extendArgs: {
        exclude: list(nonNull(globalIdArg("User"))),
        includeInactive: booleanArg(),
      },
      resolve: async (root, { offset, limit, search, sortBy, exclude, includeInactive }, ctx) => {
        const columnMap = {
          firstName: "first_name",
          lastName: "last_name",
          fullName: "full_name",
          email: "email",
          createdAt: "created_at",
          lastActiveAt: "last_active_at",
        } as const;
        return await ctx.organizations.loadOrgUsers(root.id, {
          offset,
          limit,
          search,
          excludeIds: exclude,
          includeInactive,
          sortBy: sortBy?.map((value) => {
            const [field, order] = parseSortBy(value);
            return { column: columnMap[field], order };
          }),
        });
      },
    });
    t.list.nonNull.field("integrations", {
      type: "OrgIntegration",
      args: {
        type: arg({
          type: "IntegrationType",
          description: "Filter by integration type.",
        }),
      },
      authorize: isOwnOrgOrSuperAdmin(),
      resolve: async (root, { type }, ctx) => {
        const integrations = await ctx.integrations.loadEnabledIntegrationsForOrgId(root.id);
        return type ? integrations.filter((i) => i.type === type) : integrations;
      },
    });
    t.nonNull.field("usageLimits", {
      authorize: isOwnOrgOrSuperAdmin(),
      type: objectType({
        name: "OrganizationUsageLimit",
        sourceType: /* ts*/ `{
          petitions: {
            limit: number,
            used: number
          },
          users: {
            limit: number,
          }
        }`,
        definition(t) {
          t.nonNull.field("petitions", {
            type: objectType({
              name: "OrganizationUsagePetitionLimit",
              definition(d) {
                d.nonNull.int("limit");
                d.nonNull.int("used");
              },
            }),
          });
          t.nonNull.field("users", {
            type: objectType({
              name: "OrganizationUsageUserLimit",
              definition(d) {
                d.nonNull.int("limit");
              },
            }),
          });
        },
      }),
      resolve: async (root, _, ctx) => {
        const [organization, petitionSendLimits] = await Promise.all([
          ctx.organizations.loadOrg(root.id),
          ctx.organizations.getOrganizationCurrentUsageLimit(root.id, "PETITION_SEND"),
        ]);

        return {
          petitions: {
            limit: petitionSendLimits?.limit || 0,
            used: petitionSendLimits?.used || 0,
          },
          users: {
            limit: organization!.usage_details.USER_LIMIT,
          },
        };
      },
    });
  },
});
