import deepmerge from "deepmerge";
import {
  arg,
  booleanArg,
  core,
  inputObjectType,
  intArg,
  mutationField,
  nonNull,
  nullable,
  stringArg,
} from "nexus";
import { isDefined, pick } from "remeda";
import { OrganizationTheme } from "../../db/__types";
import { defaultPdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { random } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { uploadArg } from "../helpers/scalars";
import { validateAnd } from "../helpers/validateArgs";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { inRange } from "../helpers/validators/inRange";
import { maxLength } from "../helpers/validators/maxLength";
import { validateFile } from "../helpers/validators/validateFile";
import { validFontFamily } from "../helpers/validators/validFontFamily";
import { validRichTextContent } from "../helpers/validators/validRichTextContent";
import { validWebSafeFontFamily } from "../helpers/validators/validWebSafeFontFamily";
import { userHasFeatureFlag } from "../petition/authorizers";
import { validateHexColor } from "../tag/validators";
import { contextUserHasRole } from "../users/authorizers";
import { organizationThemeIsNotDefault, userHasAccessToOrganizationTheme } from "./authorizers";

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

    const res = await ctx.aws.publicFiles.uploadFile(path, mimetype, createReadStream());

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
      await ctx.signature.updateBranding(ctx.user!.org_id);
    }

    return org;
  },
});

export const updateOrganizationPreferredTone = mutationField("updateOrganizationPreferredTone", {
  description: "Changes the organization preferred tone",
  type: "Organization",
  args: {
    tone: nonNull(arg({ type: "Tone" })),
  },
  authorize: authenticateAnd(contextUserHasRole("ADMIN")),
  resolve: async (root, args, ctx) => {
    return await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      { preferred_tone: args.tone },
      `User:${ctx.user!.id}`
    );
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
        },
      }).asArg()
    ),
  },
  validateArgs: validateAnd(
    validWebSafeFontFamily((args) => args.data.fontFamily, "data.fontFamily"),
    validateHexColor((args) => args.data.color, "data.color")
  ),
  resolve: async (_, args, ctx) => {
    const { brand_theme: theme } = (await ctx.organizations.loadOrg(ctx.user!.org_id))!;
    const organization = await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      {
        brand_theme: {
          color: args.data.color ?? theme?.color,
          fontFamily: args.data.fontFamily ?? theme?.fontFamily,
        },
      },
      `User:${ctx.user!.id}`
    );
    if (
      (isDefined(args.data.color) && theme?.color !== args.data.color) ||
      (isDefined(args.data.fontFamily) && theme?.fontFamily !== args.data.fontFamily)
    ) {
      await ctx.signature.updateBranding(ctx.user!.org_id);
    }
    return organization;
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

/** @deprecated */
export const updateOrganizationDocumentTheme = mutationField("updateOrganizationDocumentTheme", {
  deprecation: "use updateOrganizationPdfDocumentTheme",
  description: "updates the theme of the PDF documents of the organization",
  type: "Organization",
  authorize: authenticateAnd(contextUserHasRole("ADMIN")),
  args: {
    data: nonNull("OrganizationDocumentThemeInput"),
  },
  validateArgs: validateTheme((args) => args.data, "data"),
  resolve: async (_, args, ctx) => {
    const organization = await ctx.organizations.loadOrg(ctx.user!.org_id);
    const theme = deepmerge(
      organization?.pdf_document_theme ?? defaultPdfDocumentTheme,
      args.data,
      {
        // avoid deepmerge on legalText
        customMerge: (key) => (from: any, to: any) => {
          if (key === "legalText") {
            return Object.assign(from, to);
          }
        },
      }
    );
    return await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      { pdf_document_theme: theme },
      `User:${ctx.user!.id}`
    );
  },
});

/** @deprecated */
export const restoreDefaultOrganizationDocumentThemeFonts = mutationField(
  "restoreDefaultOrganizationDocumentThemeFonts",
  {
    deprecation: "use restoreDefaultOrganizationPdfDocumentThemeFonts",
    description:
      "Restores the 'fonts' section of the organization document theme to its default values",
    type: "Organization",
    authorize: authenticateAnd(contextUserHasRole("ADMIN")),
    resolve: async (_, args, ctx) => {
      const organization = await ctx.organizations.loadOrg(ctx.user!.org_id);

      const theme = Object.assign(
        organization?.pdf_document_theme ?? defaultPdfDocumentTheme,
        pick(defaultPdfDocumentTheme, [
          "title1FontFamily",
          "title1Color",
          "title1FontSize",
          "title2FontFamily",
          "title2Color",
          "title2FontSize",
          "textFontFamily",
          "textColor",
          "textFontSize",
        ])
      );
      return await ctx.organizations.updateOrganization(
        ctx.user!.org_id,
        { pdf_document_theme: theme },
        `User:${ctx.user!.id}`
      );
    },
  }
);

export const InputFeatureFlag = inputObjectType({
  name: "InputFeatureFlag",
  description: "A feature flag name with his value",
  definition(t) {
    t.nonNull.field("name", { type: "FeatureFlag" });
    t.nonNull.boolean("value");
  },
});

export const updateFeatureFlags = mutationField("updateFeatureFlags", {
  description: "Activate or deactivate a list of organization feature flag",
  type: "Organization",
  args: {
    featureFlags: nonNull(list(nonNull("InputFeatureFlag"))),
    orgId: nonNull(globalIdArg("Organization")),
  },
  authorize: authenticateAnd(contextUserHasRole("ADMIN")),
  resolve: async (_, { featureFlags, orgId }, ctx) => {
    try {
      const needRemoveBranding = featureFlags.some((f) => f.name === "REMOVE_PARALLEL_BRANDING");

      await ctx.featureFlags.addOrUpdateFeatureFlagOverride(orgId, featureFlags);
      if (needRemoveBranding) {
        await ctx.integrations.removeSignaturitBrandingIds(orgId, `User:${ctx.user!.id}`);
      }
    } catch {}

    return (await ctx.organizations.loadOrg(orgId))!;
  },
});
