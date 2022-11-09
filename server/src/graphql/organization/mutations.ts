import {
  arg,
  booleanArg,
  core,
  inputObjectType,
  intArg,
  list,
  mutationField,
  nonNull,
  nullable,
  stringArg,
} from "nexus";
import { isDefined, pick } from "remeda";
import { OrganizationTheme } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { defaultPdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { removeKeys } from "../../util/remedaExtensions";
import { random } from "../../util/token";
import { authenticateAnd, userIsSuperAdmin } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { uploadArg } from "../helpers/scalars";
import { validateAnd } from "../helpers/validateArgs";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { inRange } from "../helpers/validators/inRange";
import { maxLength } from "../helpers/validators/maxLength";
import { validateFile } from "../helpers/validators/validateFile";
import { validEmail } from "../helpers/validators/validEmail";
import { validFontFamily } from "../helpers/validators/validFontFamily";
import { validLocale } from "../helpers/validators/validLocale";
import { validRichTextContent } from "../helpers/validators/validRichTextContent";
import { validWebSafeFontFamily } from "../helpers/validators/validWebSafeFontFamily";
import { userHasFeatureFlag } from "../petition/authorizers";
import { validateHexColor } from "../tag/validators";
import { contextUserHasRole } from "../users/authorizers";
import {
  organizationHasOngoingUsagePeriod,
  organizationThemeIsNotDefault,
  userHasAccessToOrganizationTheme,
} from "./authorizers";

export const updateOrganizationLogo = mutationField("updateOrganizationLogo", {
  description: "Updates the logo of an organization",
  type: "Organization",
  args: {
    file: nonNull(uploadArg()),
    isIcon: booleanArg(),
  },
  authorize: authenticateAnd(contextUserHasRole("ADMIN")),
  validateArgs: validateFile(
    (args) => args.file,
    { contentType: ["image/gif", "image/png", "image/jpeg"], maxSize: 1024 * 1024 },
    "file"
  ),
  resolve: async (root, args, ctx) => {
    const { mimetype, createReadStream } = await args.file;
    const filename = random(16);
    const path = `uploads/${filename}`;

    const res = await ctx.storage.publicFiles.uploadFile(path, mimetype, createReadStream());

    const logoFile = await ctx.files.createPublicFile(
      {
        path,
        filename,
        content_type: mimetype,
        size: res["ContentLength"]!.toString(),
      },
      `User:${ctx.user!.id}`
    );

    const org = await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      { [args.isIcon ? "icon_public_file_id" : "logo_public_file_id"]: logoFile.id },
      `User:${ctx.user!.id}`
    );

    if (!args.isIcon) {
      await ctx.signature.updateBranding(ctx.user!.org_id, { exclude: ["DOCUSIGN"] });
    }

    return org;
  },
});

export const updateOrganizationAutoAnonymizePeriod = mutationField(
  "updateOrganizationAutoAnonymizePeriod",
  {
    description:
      "Updates the period after closed petitions of this organization are automatically anonymized.",
    type: "Organization",
    args: {
      months: nullable(intArg()),
    },
    authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("AUTO_ANONYMIZE")),
    validateArgs: inRange((args) => args.months, "months", 1),
    resolve: async (_, { months }, ctx) => {
      return await ctx.organizations.updateOrganization(
        ctx.user!.org_id,
        { anonymize_petitions_after_months: months ?? null },
        `User:${ctx.user!.id}`
      );
    },
  }
);

export const updateOrganizationBrandTheme = mutationField("updateOrganizationBrandTheme", {
  description: "updates the theme of the organization brand",
  type: "Organization",
  authorize: authenticateAnd(contextUserHasRole("ADMIN")),
  args: {
    data: nonNull(
      inputObjectType({
        name: "OrganizationBrandThemeInput",
        definition(t) {
          t.nullable.string("fontFamily");
          t.nullable.string("color");
          t.nullable.field("preferredTone", { type: "Tone" });
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    validWebSafeFontFamily((args) => args.data.fontFamily, "data.fontFamily"),
    validateHexColor((args) => args.data.color, "data.color")
  ),
  resolve: async (_, args, ctx) => {
    await ctx.organizations.updateOrganizationBrandThemeDataByOrgId(
      ctx.user!.org_id,
      removeKeys(
        {
          color: args.data.color ?? undefined,
          fontFamily: args.data.fontFamily,
          preferredTone: args.data.preferredTone ?? undefined,
        },
        ([_, value]) => value !== undefined
      ),
      `User:${ctx.user!.id}`
    );

    await ctx.signature.updateBranding(ctx.user!.org_id, { exclude: ["DOCUSIGN"] });
    return (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
  },
});

export function validateTheme<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any,
  argName: string
) {
  return validateAnd(
    ...["Top", "Right", "Bottom", "Left"].map((p) =>
      inRange((args) => prop(args)?.[`margin${p}`], `${argName}.margin${p}`, 0)
    ),
    ...["text", "title1", "title2"].flatMap((p) => [
      validFontFamily((args) => prop(args)?.[`${p}FontFamily`], `${argName}.${p}FontFamily`),
      validateHexColor((args) => prop(args)?.[`${p}Color`], `${argName}.${p}Color`),
      inRange((args) => prop(args)?.[`${p}FontSize`], `${argName}.${p}FontSize`, 5, 72),
    ]),
    ...["es", "en"].map((p) =>
      validRichTextContent((args) => prop(args)?.legalText?.[p], `${argName}.legalText.${p}`)
    )
  ) as unknown as FieldValidateArgsResolver<TypeName, FieldName>;
}

export const updateOrganizationPdfDocumentTheme = mutationField(
  "updateOrganizationPdfDocumentTheme",
  {
    description: "updates the PDF_DOCUMENT theme of the organization",
    type: "Organization",
    authorize: authenticateAnd(
      contextUserHasRole("ADMIN"),
      userHasAccessToOrganizationTheme("orgThemeId", "PDF_DOCUMENT")
    ),
    args: {
      orgThemeId: nonNull(globalIdArg("OrganizationTheme")),
      name: stringArg(),
      isDefault: booleanArg(),
      data: arg({ type: "OrganizationPdfDocumentThemeInput" }),
    },
    validateArgs: validateAnd(
      maxLength((args) => args.name, "name", 50),
      validateTheme((args) => args.data, "data")
    ),
    resolve: async (_, args, ctx) => {
      const theme = (await ctx.organizations.loadOrganizationTheme(args.orgThemeId))!;
      if (args.isDefault && !theme.is_default) {
        await ctx.organizations.setOrganizationThemeAsDefault(
          args.orgThemeId,
          `User:${ctx.user!.id}`
        );
      }
      const updateData: Partial<OrganizationTheme> = {};
      if (isDefined(args.name)) {
        updateData.name = args.name;
      }
      if (isDefined(args.data)) {
        updateData.data = {
          ...pick(theme.data, ["paginationPosition", "logoPosition"]),
          ...args.data,
        };
      }
      if (Object.keys(updateData).length > 0) {
        await ctx.organizations.updateOrganizationTheme(
          args.orgThemeId,
          updateData,
          `User:${ctx.user!.id}`
        );
      }
      return (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
    },
  }
);

export const createOrganizationPdfDocumentTheme = mutationField(
  "createOrganizationPdfDocumentTheme",
  {
    type: "Organization",
    description: "Creates a new PDF_DOCUMENT theme on the user's organization",
    authorize: authenticateAnd(contextUserHasRole("ADMIN")),
    args: {
      name: nonNull(stringArg()),
      isDefault: nonNull(booleanArg()),
    },
    validateArgs: maxLength((args) => args.name, "name", 50),
    resolve: async (_, { name, isDefault }, ctx) => {
      const theme = await ctx.organizations.createOrganizationTheme(
        ctx.user!.org_id,
        name,
        "PDF_DOCUMENT",
        defaultPdfDocumentTheme,
        `User:${ctx.user!.id}`
      );
      if (isDefault) {
        await ctx.organizations.setOrganizationThemeAsDefault(theme.id, `User:${ctx.user!.id}`);
      }

      return (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
    },
  }
);

export const deleteOrganizationPdfDocumentTheme = mutationField(
  "deleteOrganizationPdfDocumentTheme",
  {
    type: "Organization",
    authorize: authenticateAnd(
      contextUserHasRole("ADMIN"),
      userHasAccessToOrganizationTheme("orgThemeId", "PDF_DOCUMENT"),
      organizationThemeIsNotDefault("orgThemeId")
    ),
    args: {
      orgThemeId: nonNull(globalIdArg("OrganizationTheme")),
    },
    resolve: async (_, { orgThemeId }, ctx) => {
      await ctx.organizations.deleteOrganizationTheme(orgThemeId, ctx.user!);
      return (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
    },
  }
);

export const updateFeatureFlags = mutationField("updateFeatureFlags", {
  description: "Activate or deactivate a list of organization feature flag",
  type: "Organization",
  args: {
    featureFlags: nonNull(
      list(
        nonNull(
          inputObjectType({
            name: "InputFeatureFlagNameValue",
            description: "A feature flag name with his value",
            definition(t) {
              t.nonNull.field("name", { type: "FeatureFlag" });
              t.nonNull.boolean("value");
            },
          })
        )
      )
    ),
    orgId: nonNull(globalIdArg("Organization")),
  },
  authorize: authenticateAnd(userIsSuperAdmin()),
  resolve: async (_, { featureFlags, orgId }, ctx) => {
    const needRemoveBranding = featureFlags.some((f) => f.name === "REMOVE_PARALLEL_BRANDING");

    await ctx.featureFlags.upsertFeatureFlagOverride(orgId, featureFlags);
    if (needRemoveBranding) {
      await ctx.signature.updateBranding(orgId);
    }

    return (await ctx.organizations.loadOrg(orgId))!;
  },
});

export const createOrganization = mutationField("createOrganization", {
  description:
    "Creates a new organization. Sends email to owner ONLY if it's not registered in any other organization.",
  type: "Organization",
  args: {
    name: nonNull(stringArg({ description: "Name of the organization" })),
    status: nonNull("OrganizationStatus"),
    firstName: nonNull(stringArg({ description: "First name of the organization owner" })),
    lastName: nonNull(stringArg({ description: "Last name of the organization owner" })),
    email: nonNull(stringArg({ description: "Email of the organization owner" })),
    locale: nonNull("PetitionLocale"),
  },
  authorize: authenticateAnd(userIsSuperAdmin()),
  validateArgs: validateAnd(
    validLocale((args) => args.locale, "locale"),
    validEmail((args) => args.email, "email"),
    (_, { status }, ctx, info) => {
      if (status === "ROOT") {
        throw new ArgValidationError(info, "status", "Can't create an org with ROOT status");
      }
    }
  ),
  resolve: async (_, args, ctx) => {
    const org = await ctx.organizations.createOrganization(
      {
        name: args.name.trim(),
        status: args.status,
      },
      `User:${ctx.user!.id}`
    );

    const email = args.email.trim().toLowerCase();
    const userData = (await ctx.users.loadUserData(ctx.user!.user_data_id))!;
    const cognitoId = await ctx.auth.getOrCreateCognitoUser(
      email,
      null,
      args.firstName,
      args.lastName,
      {
        locale: args.locale ?? "en",
        organizationName: org.name,
        organizationUser: fullName(userData.first_name, userData.last_name),
      },
      true
    );

    await ctx.users.createUser(
      {
        org_id: org.id,
        organization_role: "OWNER",
      },
      {
        cognito_id: cognitoId,
        email,
        first_name: args.firstName,
        last_name: args.lastName,
        details: { source: "parallel", preferredLocale: args.locale ?? "en" },
      },
      `User:${ctx.user!.id}`
    );

    await ctx.tiers.updateOrganizationTier(org, "FREE", `User:${ctx.user!.id}`);
    // load org to get updated usage_details
    return (await ctx.organizations.loadOrg(org.id))!;
  },
});

export const updateOrganizationUserLimit = mutationField("updateOrganizationUserLimit", {
  description: "Updates the user limit for a organization",
  type: "Organization",
  args: {
    orgId: nonNull(globalIdArg("Organization")),
    limit: nonNull(intArg({ description: "How many users allow the org to create" })),
  },
  authorize: authenticateAnd(userIsSuperAdmin()),
  resolve: async (_, { orgId, limit }, ctx) => {
    return await ctx.organizations.updateOrganizationUsageDetails(
      orgId,
      { USER_LIMIT: limit },
      `User:${ctx.user!.id}`
    );
  },
});

export const updateOrganizationUsageDetails = mutationField("updateOrganizationUsageDetails", {
  type: "Organization",
  description:
    "Updates the usage_details of a given organization. Will impact the limits of coming usage periods.",
  authorize: authenticateAnd(userIsSuperAdmin()),
  args: {
    orgId: nonNull(globalIdArg("Organization")),
    limitName: nonNull("OrganizationUsageLimitName"),
    limit: nonNull(
      intArg({ description: "How many credits allow the org to use in the given period" })
    ),
    duration: nonNull("Duration"),
    renewalCycles: nonNull(
      intArg({
        description:
          "How many cycles this subscription will renew until it finishes. Zero means infinite",
      })
    ),
    startNewPeriod: nonNull(
      booleanArg({
        description: "End current period and start new with this arguments.",
      })
    ),
  },
  resolve: async (_, args, ctx) => {
    const org = await ctx.organizations.updateOrganizationUsageDetails(
      args.orgId,
      {
        [args.limitName]: {
          duration: args.duration,
          limit: args.limit,
          renewal_cycles: args.renewalCycles > 0 ? args.renewalCycles : null,
        },
      },
      `User:${ctx.user!.id}`
    );
    if (args.startNewPeriod) {
      await ctx.organizations.startNewOrganizationUsageLimitPeriod(
        args.orgId,
        args.limitName,
        args.limit,
        args.duration
      );
    }

    return org;
  },
});

export const modifyCurrentUsagePeriod = mutationField("modifyCurrentUsagePeriod", {
  description: "Updates the limit of the current usage limit of a given organization",
  type: "Organization",
  authorize: authenticateAnd(
    userIsSuperAdmin(),
    organizationHasOngoingUsagePeriod("orgId", "limitName")
  ),
  args: {
    orgId: nonNull(globalIdArg("Organization")),
    limitName: nonNull("OrganizationUsageLimitName"),
    newLimit: nonNull(intArg()),
  },
  validateArgs: inRange((args) => args.newLimit, "newLimit", 0),
  resolve: async (_, args, ctx) => {
    await ctx.organizations.updateOrganizationCurrentUsageLimit(
      args.orgId,
      args.limitName,
      args.newLimit
    );
    return (await ctx.organizations.loadOrg(args.orgId))!;
  },
});

export const shareSignaturitApiKey = mutationField("shareSignaturitApiKey", {
  description: `Shares our SignaturIt production APIKEY with the passed Org, creates corresponding usage limits and activates PETITION_SIGNATURE feature flag.`,
  type: "Organization",
  args: {
    orgId: nonNull(globalIdArg("Organization")),
    limit: nonNull(
      intArg({ description: "How many credits allow the org to use in the given period" })
    ),
    duration: nonNull("Duration"),
  },
  authorize: authenticateAnd(userIsSuperAdmin()),
  resolve: async (_, { orgId, duration, limit }, ctx) => {
    const signatureIntegrations = await ctx.integrations.loadIntegrationsByOrgId(
      orgId,
      "SIGNATURE",
      "SIGNATURIT"
    );

    const hasSharedSignaturitApiKey =
      signatureIntegrations.length > 0 &&
      signatureIntegrations.some(
        (i) =>
          i.settings.CREDENTIALS.API_KEY ===
            ctx.config.signature.signaturitSharedProductionApiKey &&
          i.settings.ENVIRONMENT === "production" &&
          i.is_enabled
      );

    return await ctx.organizations.withTransaction(async (t) => {
      const [organization] = await Promise.all([
        ctx.organizations.updateOrganizationUsageDetails(
          orgId,
          {
            SIGNATURIT_SHARED_APIKEY: {
              limit,
              duration,
              renewal_cycles: null, // TODO check this
            },
          },
          `User:${ctx.user!.id}`,
          t
        ),
        !hasSharedSignaturitApiKey
          ? ctx.integrations.createOrgIntegration<"SIGNATURE", "SIGNATURIT">(
              {
                type: "SIGNATURE",
                provider: "SIGNATURIT",
                name: "Signaturit",
                org_id: orgId,
                settings: {
                  CREDENTIALS: {
                    API_KEY: ctx.config.signature.signaturitSharedProductionApiKey,
                  },
                  ENVIRONMENT: "production",
                },
                is_enabled: true,
              },
              `User:${ctx.user!.id}`,
              t
            )
          : null,
        ctx.organizations.startNewOrganizationUsageLimitPeriod(
          orgId,
          "SIGNATURIT_SHARED_APIKEY",
          limit,
          duration,
          t
        ),
        ctx.featureFlags.upsertFeatureFlagOverride(
          orgId,
          { name: "PETITION_SIGNATURE", value: true },
          t
        ),
      ]);
      return organization;
    });
  },
});
