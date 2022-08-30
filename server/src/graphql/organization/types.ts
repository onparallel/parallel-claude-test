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
import { equals, isDefined, omit, pick } from "remeda";
import { defaultBrandTheme } from "../../util/BrandTheme";
import { defaultPdfDocumentTheme, PdfDocumentTheme } from "../../util/PdfDocumentTheme";
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

/** @deprecated not used anymore */
export const OrganizationDocumentThemeInput = inputObjectType({
  name: "OrganizationDocumentThemeInput",
  definition(t) {
    t.nullable.float("marginTop");
    t.nullable.float("marginRight");
    t.nullable.float("marginBottom");
    t.nullable.float("marginLeft");
    t.nullable.boolean("showLogo");
    t.nullable.string("title1FontFamily");
    t.nullable.string("title1Color");
    t.nullable.float("title1FontSize");
    t.nullable.string("title2FontFamily");
    t.nullable.string("title2Color");
    t.nullable.float("title2FontSize");
    t.nullable.string("textFontFamily");
    t.nullable.string("textColor");
    t.nullable.float("textFontSize");
    t.nullable.field("legalText", {
      type: inputObjectType({
        name: "OrganizationDocumentThemeInputLegalText",
        definition(t) {
          t.nullable.json("es");
          t.nullable.json("en");
        },
      }),
    });
  },
}).asArg();

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
          } | null
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
          t.nullable.field("signatures", {
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
          },
          users: {
            limit: organization!.usage_details.USER_LIMIT,
          },
          signatures: hasSharedSignatureIntegration
            ? pick(signatureSendLimits, ["limit", "used"])
            : null,
        };
      },
    });
    /** @deprecated */
    t.nonNull.field("preferredTone", {
      type: "Tone",
      deprecation: "use brandTheme.preferredTone",
      description: "The preferred tone of organization.",
      resolve: (o) => {
        return o.preferred_tone;
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
    t.nonNull.jsonObject("pdfDocumentTheme", {
      deprecation: "Not used anymore. Use themes.pdfDocument[0].data",
      resolve: (o) => {
        return o.pdf_document_theme ?? defaultPdfDocumentTheme;
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
    t.nonNull.boolean("isPdfDocumentThemeFontsDirty", {
      deprecation: "Not used anymore. Use themes.pdfDocument[0].isDirty",
      description:
        "Wether the 'fonts' section of the document theme has been changed from its default values or not",
      resolve: (o) => {
        const fontKeys = [
          "title1FontFamily",
          "title1Color",
          "title1FontSize",
          "title2FontFamily",
          "title2Color",
          "title2FontSize",
          "textFontFamily",
          "textColor",
          "textFontSize",
        ] as (keyof PdfDocumentTheme)[];
        const currentThemeFonts = pick(o.pdf_document_theme ?? defaultPdfDocumentTheme, fontKeys);
        const defaultThemeFonts = pick(defaultPdfDocumentTheme, fontKeys);
        return !equals(currentThemeFonts, defaultThemeFonts);
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
