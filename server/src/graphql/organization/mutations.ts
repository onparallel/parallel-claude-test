import deepmerge from "deepmerge";
import {
  arg,
  booleanArg,
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

    const [org] = await Promise.all([
      ctx.organizations.updateOrganization(
        ctx.user!.org_id,
        { [args.isIcon ? "icon_public_file_id" : "logo_public_file_id"]: logoFile.id },
        `User:${ctx.user!.id}`
      ),
      args.isIcon
        ? null
        : ctx.integrations.removeSignaturitBrandingIds(ctx.user!.org_id, `User:${ctx.user!.id}`),
    ]);

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
    const organization = await ctx.organizations.loadOrg(ctx.user!.org_id);
    const theme = Object.assign(organization?.brand_theme ?? {}, args.data);
    if (isDefined(args.data.color) && organization?.brand_theme?.color !== args.data.color) {
      ctx.integrations.removeSignaturitBrandingIds(ctx.user!.org_id, `User:${ctx.user!.id}`);
    }
    return await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      { brand_theme: theme },
      `User:${ctx.user!.id}`
    );
  },
});

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
      data: nonNull(
        inputObjectType({
          name: "UpdateOrganizationPdfDocumentThemeInput",
          definition(t) {
            t.nullable.string("name");
            t.nullable.boolean("isDefault");
            t.nullable.field({ name: "theme", type: "OrganizationPdfDocumentThemeInput" });
          },
        }).asArg()
      ),
    },
    validateArgs: validateAnd(
      inRange((args) => args.data.theme?.marginTop, "data.theme.marginTop", 0),
      inRange((args) => args.data.theme?.marginLeft, "data.theme.marginLeft", 0),
      inRange((args) => args.data.theme?.marginBottom, "data.theme.marginBottom", 0),
      inRange((args) => args.data.theme?.marginRight, "data.theme.marginRight", 0),
      validFontFamily((args) => args.data.theme?.title1FontFamily, "data.theme.title1FontFamily"),
      validFontFamily((args) => args.data.theme?.title2FontFamily, "data.theme.title2FontFamily"),
      validFontFamily((args) => args.data.theme?.textFontFamily, "data.theme.textFontFamily"),
      validateHexColor((args) => args.data.theme?.title1Color, "data.theme.title1Color"),
      validateHexColor((args) => args.data.theme?.title2Color, "data.theme.title2Color"),
      validateHexColor((args) => args.data.theme?.textColor, "data.theme.textColor"),
      inRange((args) => args.data.theme?.title1FontSize, "data.theme.title1FontSize", 5, 72),
      inRange((args) => args.data.theme?.title2FontSize, "data.theme.title2FontSize", 5, 72),
      inRange((args) => args.data.theme?.textFontSize, "data.theme.textFontSize", 5, 72),
      validRichTextContent((args) => args.data.theme?.legalText?.es, "data.theme.legalText.es"),
      validRichTextContent((args) => args.data.theme?.legalText?.en, "data.theme.legalText.en"),
      maxLength((args) => args.data.name, "data.name", 255)
    ),
    resolve: async (_, args, ctx) => {
      if (args.data.isDefault) {
        await ctx.organizations.setOrganizationThemeAsDefault(
          args.orgThemeId,
          `User:${ctx.user!.id}`
        );
      }
      const updateData: Partial<OrganizationTheme> = {};
      if (isDefined(args.data.name)) {
        updateData.name = args.data.name;
      }
      if (isDefined(args.data.theme)) {
        const pdfDocumentTheme = (await ctx.organizations.loadOrganizationTheme(args.orgThemeId))!;
        updateData.data = deepmerge(pdfDocumentTheme.data, args.data.theme, {
          // avoid deepmerge on legalText
          customMerge: (key) => (from: any, to: any) => {
            if (key === "legalText") {
              return Object.assign(from, to);
            }
          },
        });
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
    validateArgs: maxLength((args) => args.name, "name", 255),
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
      await ctx.organizations.deleteOrganizationTheme(orgThemeId, `User:${ctx.user!.id}`);
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
  validateArgs: validateAnd(
    inRange((args) => args.data.marginTop, "data.marginTop", 0),
    inRange((args) => args.data.marginLeft, "data.marginLeft", 0),
    inRange((args) => args.data.marginBottom, "data.marginBottom", 0),
    inRange((args) => args.data.marginRight, "data.marginRight", 0),
    validFontFamily((args) => args.data.title1FontFamily, "data.title1FontFamily"),
    validFontFamily((args) => args.data.title2FontFamily, "data.title2FontFamily"),
    validFontFamily((args) => args.data.textFontFamily, "data.textFontFamily"),
    validateHexColor((args) => args.data.title1Color, "data.title1Color"),
    validateHexColor((args) => args.data.title2Color, "data.title2Color"),
    validateHexColor((args) => args.data.textColor, "data.textColor"),
    inRange((args) => args.data.title1FontSize, "data.title1FontSize", 5, 72),
    inRange((args) => args.data.title2FontSize, "data.title2FontSize", 5, 72),
    inRange((args) => args.data.textFontSize, "data.textFontSize", 5, 72),
    validRichTextContent((args) => args.data.legalText?.es, "data.legalText.es"),
    validRichTextContent((args) => args.data.legalText?.en, "data.legalText.en")
  ),
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

export const restoreDefaultOrganizationDocumentThemeFonts = mutationField(
  "restoreDefaultOrganizationDocumentThemeFonts",
  {
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
