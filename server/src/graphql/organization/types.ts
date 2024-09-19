import { add } from "date-fns";
import {
  arg,
  booleanArg,
  enumType,
  inputObjectType,
  list,
  nonNull,
  nullable,
  objectType,
  stringArg,
} from "nexus";
import { isNonNullish, omit } from "remeda";
import { defaultBrandTheme } from "../../util/BrandTheme";
import { addDuration, multiplyDuration } from "../../util/duration";
import { and, or } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { parseSortBy } from "../helpers/paginationPlugin";
import { validEmail } from "../helpers/validators/validEmail";
import { contextUserHasPermission } from "../users/authorizers";
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

export const OrganizationUsageLimit = objectType({
  name: "OrganizationUsageLimit",
  sourceType: "db.OrganizationUsageLimit",
  definition(t) {
    t.nonNull.globalId("id", { prefixName: "OrganizationUsageLimit" });
    t.nonNull.float("limit");
    t.nonNull.float("used");
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
        return isNonNullish(path) ? await ctx.images.getImageUrl(path, args.options as any) : null;
      },
    });
    t.nullable.string("iconUrl", {
      description: "URL of the organization logo",
      args: {
        options: arg({ type: "ImageOptions" }),
      },
      resolve: async (root, args, ctx) => {
        const path = await ctx.organizations.loadOrgIconPath(root.id);
        return isNonNullish(path) ? await ctx.images.getImageUrl(path, args.options as any) : null;
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
        searchByEmailOnly: booleanArg(),
        filters: inputObjectType({
          name: "UserFilter",
          definition(t) {
            t.nullable.list.nonNull.field("status", { type: "UserStatus" });
          },
        }),
      },
      resolve: (
        root,
        { offset, limit, search, sortBy, exclude, filters, searchByEmailOnly },
        ctx,
      ) => {
        const columnMap = {
          firstName: "first_name",
          lastName: "last_name",
          fullName: "full_name",
          email: "email",
          createdAt: "created_at",
          lastActiveAt: "last_active_at",
        } as const;
        return ctx.organizations.getPaginatedUsersForOrg(root.id, {
          offset,
          limit,
          search,
          excludeIds: exclude,
          searchByEmailOnly,
          status: filters?.status,
          sortBy: sortBy?.map((value) => {
            const [field, order] = parseSortBy(value);
            return { field: columnMap[field], order };
          }),
        });
      },
    });
    t.paginationField("usersByEmail", {
      type: "User",
      description: "The users in the organization filtered by a list of emails.",
      authorize: and(isOwnOrgOrSuperAdmin(), contextUserHasPermission("USERS:LIST_USERS")),
      extendArgs: {
        emails: nonNull(list(nonNull(stringArg()))),
      },
      validateArgs: validEmail((args) => args.emails, "emails", true),
      resolve: (root, { offset, limit, emails }, ctx) => {
        return ctx.organizations.getOrganizationUsersFilteredByEmail(root.id, {
          offset,
          limit,
          emails,
        });
      },
    });
    t.paginationField("integrations", {
      type: "IOrgIntegration",
      description: "A paginated list with enabled integrations for the organization",
      extendArgs: {
        type: nullable(
          arg({
            type: "IntegrationType",
            description: "Filter by integration type.",
          }),
        ),
      },
      authorize: isOwnOrgOrSuperAdmin(),
      resolve: (root, { limit, offset, type }, ctx) =>
        ctx.integrations.getPaginatedIntegrationsForOrg(root.id, {
          type,
          offset,
          limit,
        }),
    });
    t.boolean("hasIntegration", {
      authorize: isOwnOrgOrSuperAdmin(),
      args: {
        integration: nonNull(arg({ type: "IntegrationType" })),
        provider: stringArg(),
      },
      resolve: async (root, { integration, provider }, ctx) => {
        const integrations = await ctx.integrations.loadIntegrationsByOrgId(
          root.id,
          integration,
          provider,
        );
        return integrations.some((int) => int.is_enabled);
      },
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
      resolve: (root, { limitName, limit, offset }, ctx) => {
        return ctx.organizations.getPaginatedUsageLimitsForOrg(root.id, {
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
        return await ctx.organizations.loadCurrentOrganizationUsageLimit(root.id, args.limitName);
      },
    });
    t.nullable.datetime("subscriptionEndDate", {
      authorize: isOwnOrgOrSuperAdmin(),
      args: {
        limitName: nonNull("OrganizationUsageLimitName"),
      },
      resolve: async (root, args, ctx) => {
        const currentUsageLimit = await ctx.organizations.loadCurrentOrganizationUsageLimit(
          root.id,
          args.limitName,
        );
        if (!currentUsageLimit) {
          return null;
        }
        const usageDetails = root.usage_details[args.limitName];
        if (!usageDetails || !usageDetails.renewal_cycles) {
          return null;
        }
        return add(
          currentUsageLimit.period_start_date,
          addDuration(
            currentUsageLimit.period,
            multiplyDuration(
              usageDetails.duration,
              usageDetails.renewal_cycles - currentUsageLimit.cycle_number,
            ),
          ),
        );
      },
    });
    t.boolean("isUsageLimitReached", {
      authorize: isOwnOrgOrSuperAdmin(),
      args: { limitName: nonNull("OrganizationUsageLimitName") },
      resolve: async (root, { limitName }, ctx) => {
        const usage = await ctx.organizations.loadCurrentOrganizationUsageLimit(root.id, limitName);
        return !usage || usage.limit <= usage.used;
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
