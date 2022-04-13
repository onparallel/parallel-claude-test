import { arg, booleanArg, enumType, list, nonNull, nullable, objectType } from "nexus";
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

export const Tone = enumType({
  name: "Tone",
  members: ["FORMAL", "INFORMAL"],
  description: "The preferred tone of organization",
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
    t.nullable.string("customHost", {
      description: "Custom host used in petition links and public links.",
      resolve: (o) => o.custom_host,
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
        const ssoIntegrations = await ctx.integrations.loadIntegrationsByOrgId(o.id, "SSO");
        return ssoIntegrations.length > 0;
      },
    });
    t.int("activeUserCount", {
      description: "The total number of active users",
      authorize: isOwnOrgOrSuperAdmin(),
      resolve: async (root, _, ctx) => await ctx.organizations.loadActiveUserCount(root.id),
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
    t.paginationField("integrations", {
      type: "OrgIntegration",
      description: "A paginated list with enabled integrations for the organization",
      extendArgs: {
        type: nullable(
          arg({
            type: "IntegrationType",
            description: "Filter by integration type.",
          })
        ),
      },
      authorize: isOwnOrgOrSuperAdmin(),
      resolve: async (root, { limit, offset, type }, ctx) =>
        await ctx.integrations.loadPaginatedIntegrations(root.id, {
          type,
          offset,
          limit,
        }),
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
          },
          signatures: {
            limit: number,
            used: number,
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
          t.nonNull.field("signatures", {
            type: objectType({
              name: "OrganizationUsageSignaturesLimit",
              definition(d) {
                d.nonNull.int("limit");
                d.nonNull.int("used");
              },
            }),
          });
        },
      }),
      resolve: async (root, _, ctx) => {
        const [organization, petitionSendLimits, signatureSendLimits] = await Promise.all([
          ctx.organizations.loadOrg(root.id),
          ctx.organizations.getOrganizationCurrentUsageLimit(root.id, "PETITION_SEND"),
          ctx.organizations.getOrganizationCurrentUsageLimit(root.id, "SIGNATURIT_SHARED_APIKEY"),
        ]);

        return {
          petitions: {
            limit: petitionSendLimits?.limit || 0,
            used: petitionSendLimits?.used || 0,
          },
          users: {
            limit: organization!.usage_details.USER_LIMIT,
          },
          signatures: {
            limit: signatureSendLimits?.limit || 0,
            used: signatureSendLimits?.used || 0,
          },
        };
      },
    });
    t.nonNull.field("preferredTone", {
      type: "Tone",
      description: "The preferred tone of organization.",
      resolve: (o) => {
        return o.preferred_tone;
      },
    });
    t.nonNull.jsonObject("pdfDocumentTheme", {
      resolve: () => {
        return {
          marginLeft: 10,
          marginRight: 10,
          marginTop: 10,
          marginBottom: 15,
          title1FontFamily: "IBM Plex Sans",
          title1Color: "#000000",
          title1FontSize: 16,
          title2FontFamily: "IBM Plex Sans",
          title2Color: "#000000",
          title2FontSize: 14,
          textFontFamily: "IBM Plex Sans",
          textColor: "#000000",
          textFontSize: 12,
          logoPosition: "center",
          paginationPosition: "right",
        };
      },
    });
  },
});
