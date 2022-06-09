import deepmerge from "deepmerge";
import { arg, booleanArg, inputObjectType, intArg, mutationField, nonNull, nullable } from "nexus";
import { defaultDocumentTheme } from "../../pdf/utils/ThemeProvider";
import { random } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { uploadArg } from "../helpers/scalars";
import { validateAnd } from "../helpers/validateArgs";
import { inRange } from "../helpers/validators/inRange";
import { validateFile } from "../helpers/validators/validateFile";
import { validFontFamily } from "../helpers/validators/validFontFamily";
import { validRichTextContent } from "../helpers/validators/validRichTextContent";
import { userHasFeatureFlag } from "../petition/authorizers";
import { validateHexColor } from "../tag/validators";
import { contextUserHasRole } from "../users/authorizers";

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
        { anonymize_petitions_after_days: months ? months * 30 : null },
        `User:${ctx.user!.id}`
      );
    },
  }
);

export const updateOrganizationDocumentTheme = mutationField("updateOrganizationDocumentTheme", {
  description: "updates the theme of the PDF documents of the organization",
  type: "Organization",
  authorize: authenticateAnd(contextUserHasRole("ADMIN")),
  args: {
    data: nonNull(
      inputObjectType({
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
      }).asArg()
    ),
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
    const theme = deepmerge(organization?.pdf_document_theme ?? defaultDocumentTheme, args.data, {
      // avoid deepmerge on legalText
      customMerge: (key) => (from: any, to: any) => {
        if (key === "legalText") {
          return Object.assign(from, to);
        }
      },
    });
    return await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      { pdf_document_theme: theme },
      `User:${ctx.user!.id}`
    );
  },
});
