import {
  arg,
  booleanArg,
  enumType,
  inputObjectType,
  list,
  nonNull,
  nullable,
  objectType,
} from "nexus";
import { isDefined, omit, pick } from "remeda";
import { defaultBrandTheme } from "../../util/BrandTheme";
import { or, userIsSuperAdmin } from "../helpers/authorize";
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

export const OrganizationUsageLimitName = enumType({
  name: "OrganizationUsageLimitName",
  members: ["PETITION_SEND", "SIGNATURIT_SHARED_APIKEY"],
});

export const OrgLicenseSource = enumType({
  name: "OrgLicenseSource",
  members: ["APPSUMO"],
});

export const OrgLicense = objectType({
  name: "OrgLicense",
  description: "An object describing the license of an organization",
  definition(t) {
    t.field("source", { type: "OrgLicenseSource" });
    t.string("name");
    t.string("externalId");
  },
});

export const OrganizationTheme = objectType({
  name: "OrganizationTheme",
  definition(t) {
    t.globalId("id");
    t.nonNull.string("name");
    t.nonNull.boolean("isDefault", { resolve: (o) => o.is_default ?? false });
    t.nonNull.jsonObject("data", { resolve: (o) => o.data });
  },
  sourceType: "db.OrganizationTheme",
});

export const OrganizationPdfDocumentThemeInput = inputObjectType({
  name: "OrganizationPdfDocumentThemeInput",
  definition(t) {
    t.float("marginTop");
    t.float("marginRight");
    t.float("marginBottom");
    t.float("marginLeft");
    t.boolean("showLogo");
    t.string("title1FontFamily");
    t.string("title1Color");
    t.float("title1FontSize");
    t.string("title2FontFamily");
    t.string("title2Color");
    t.float("title2FontSize");
    t.string("textFontFamily");
    t.string("textColor");
    t.float("textFontSize");
    t.field("legalText", {
      type: inputObjectType({
        name: "OrganizationPdfDocumentThemeInputLegalText",
        definition(t) {
          t.json("es");
          t.json("en");
        },
      }),
    });
  },
}).asArg();

export const OrganizationUsageLimit = objectType({
  name: "OrganizationUsageLimit",
  sourceType: "db.OrganizationUsageLimit",
  definition(t) {
    t.nonNull.globalId("id", { prefixName: "OrganizationUsageLimit" });
    t.nonNull.int("limit");
    t.nonNull.int("used");
    t.nonNull.duration("period");
    t.nonNull.datetime("periodStartDate", { resolve: (o) => o.period_start_date });
    t.nullable.datetime("periodEndDate", { resolve: (o) => o.period_end_date });
    t.nonNull.int("cycleNumber", { resolve: (o) => o.cycle_number });
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
    t.nullable.string("customHost", {
      description: "Custom host used in petition links and public links.",
      resolve: (o) => o.custom_host,
    });
    t.nullable.string("logoUrl", {
      description: "URL of the organization logo",
      args: {
        options: arg({ type: "ImageOptions" }),
      },
      resolve: async (root, args, ctx) => {
        const path = await ctx.organizations.loadOrgLogoPath(root.id);
        return isDefined(path) ? await ctx.images.getImageUrl(path, args.options as any) : null;
      },
    });
    t.nullable.string("iconUrl", {
      description: "URL of the organization logo",
      args: {
        options: arg({ type: "ImageOptions" }),
      },
      resolve: async (root, args, ctx) => {
        const path = await ctx.organizations.loadOrgIconPath(root.id);
        return isDefined(path) ? await ctx.images.getImageUrl(path, args.options as any) : null;
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
      authorize: or(isOwnOrgOrSuperAdmin(), async (root, _, ctx) => {
        // let users who also have a user in the org to check the userCount
        const users = await ctx.users.loadUsersByUserDataId(ctx.realUser!.user_data_id);
        return users.some((u) => u.org_id === root.id);
      }),
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
            return { field: columnMap[field], order };
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
    t.nonNull.jsonObject("usageDetails", {
      authorize: isOwnOrgOrSuperAdmin(),
      resolve: (o) => o.usage_details,
    });
    t.paginationField("usagePeriods", {
      type: "OrganizationUsageLimit",
      authorize: isOwnOrgOrSuperAdmin(),
      extendArgs: {
        limitName: nonNull("OrganizationUsageLimitName"),
      },
      resolve: async (root, { limitName, limit, offset }, ctx) => {
        return await ctx.organizations.loadPaginatedUsageLimits(root.id, {
          limitName,
          limit,
          offset,
        });
      },
    });
    t.nullable.field("currentUsagePeriod", {
      type: "OrganizationUsageLimit",
      authorize: isOwnOrgOrSuperAdmin(),
      args: {
        limitName: nonNull("OrganizationUsageLimitName"),
      },
      resolve: async (root, args, ctx) => {
        return await ctx.organizations.getOrganizationCurrentUsageLimit(root.id, args.limitName);
      },
    });
    t.boolean("isUsageLimitReached", {
      authorize: isOwnOrgOrSuperAdmin(),
      args: { limitName: nonNull("OrganizationUsageLimitName") },
      resolve: async (root, { limitName }, ctx) => {
        const limit = await ctx.organizations.getOrganizationCurrentUsageLimit(root.id, limitName);
        return !limit || limit.limit <= limit.used;
      },
    });
    /** @deprecated */
    t.nonNull.field("usageLimits", {
      deprecation: "use usagePeriods pagination",
      authorize: isOwnOrgOrSuperAdmin(),
      type: objectType({
        name: "OrganizationUsageLimits",
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
          } | null
        }`,
        definition(t) {
          t.nonNull.field("petitions", {
            type: "OrganizationUsageLimit",
          });
          t.nonNull.field("users", {
            type: objectType({
              name: "OrganizationUsageUserLimit",
              definition(d) {
                d.nonNull.int("limit");
              },
            }),
          });
          t.nullable.field("signatures", {
            type: "OrganizationUsageLimit",
          });
        },
      }),
      resolve: async (root, _, ctx) => {
        const [organization, petitionSendLimits, signatureSendLimits, signatureIntegrations] =
          await Promise.all([
            ctx.organizations.loadOrg(root.id),
            ctx.organizations.getOrganizationCurrentUsageLimit(root.id, "PETITION_SEND"),
            ctx.organizations.getOrganizationCurrentUsageLimit(root.id, "SIGNATURIT_SHARED_APIKEY"),
            ctx.integrations.loadIntegrationsByOrgId(root.id, "SIGNATURE"),
          ]);

        // only return signature limits if org has an enabled signature integration with our shared APIKEY
        const hasSharedSignatureIntegration =
          isDefined(signatureSendLimits) &&
          signatureIntegrations.some(
            (i) =>
              i.provider.toUpperCase() === "SIGNATURIT" &&
              i.settings.CREDENTIALS.API_KEY ===
                ctx.config.signature.signaturitSharedProductionApiKey &&
              i.settings.ENVIRONMENT === "production" &&
              i.is_enabled
          );

        return {
          petitions: {
            limit: petitionSendLimits?.limit || 0,
            used: petitionSendLimits?.used || 0,
            period: petitionSendLimits!.period as any,
          },
          users: {
            limit: organization!.usage_details.USER_LIMIT,
          },
          signatures: hasSharedSignatureIntegration
            ? pick(signatureSendLimits, ["limit", "used", "period"])
            : null,
        };
      },
    });
    t.nonNull.list.nonNull.field("pdfDocumentThemes", {
      type: "OrganizationTheme",
      resolve: async (o, _, ctx) => {
        const themes = await ctx.organizations.loadPdfDocumentThemesByOrgId(o.id);
        return themes.map((theme) => ({
          ...theme,
          data: omit(theme.data, ["paginationPosition", "logoPosition"]),
        }));
      },
    });
    t.nonNull.field("brandTheme", {
      type: objectType({
        name: "OrganizationBrandThemeData",
        definition(t) {
          t.nullable.string("fontFamily");
          t.nonNull.string("color");
          t.nonNull.field("preferredTone", { type: "Tone" });
        },
      }),
      resolve: async (o, _, ctx) => {
        const theme = await ctx.organizations.loadOrgBrandTheme(o.id);
        return theme?.data ?? defaultBrandTheme;
      },
    });
    t.nullable.field("license", {
      type: "OrgLicense",
      description: "Current license for the organization",
      resolve: (o) => {
        return o.appsumo_license && o.appsumo_license.action !== "refund"
          ? {
              source: "APPSUMO",
              name: o.appsumo_license.parallel_tier,
              externalId: o.appsumo_license.invoice_item_uuid,
            }
          : null;
      },
    });
    t.nullable.int("anonymizePetitionsAfterMonths", {
      resolve: (o) => o.anonymize_petitions_after_months,
    });
    t.nonNull.list.nonNull.field("features", {
      description: "A list of all feature flag and the value asigned to this org",
      authorize: isOwnOrgOrSuperAdmin(),
      type: "FeatureFlagNameValue",
      resolve: async (o, _, ctx) => {
        return await ctx.featureFlags.getOrganizationFeatureFlags(o.id);
      },
    });
  },
});
