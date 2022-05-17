import { ApolloError } from "apollo-server-core";
import { arg, booleanArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { random } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { uploadArg } from "../helpers/scalars";
import { validateFile } from "../helpers/validators/validateFile";
import { userHasFeatureFlag } from "../petition/authorizers";
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
      period: nullable(stringArg()),
    },
    authorize: authenticateAnd(contextUserHasRole("ADMIN"), userHasFeatureFlag("AUTO_ANONYMIZE")),
    resolve: async (_, args, ctx) => {
      try {
        return await ctx.organizations.updateOrganization(
          ctx.user!.org_id,
          { anonymize_petitions_after: args.period },
          `User:${ctx.user!.id}`
        );
      } catch (error: any) {
        if ((error.message as string).includes("invalid input syntax for type interval")) {
          throw new ApolloError(`Invalid period ${args.period}`, "INVALID_PERIOD_ERROR");
        } else {
          throw error;
        }
      }
    },
  }
);
