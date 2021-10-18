import { arg, mutationField, nonNull } from "nexus";
import { random } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { uploadArg } from "../helpers/upload";
import { validateAnd } from "../helpers/validateArgs";
import { contentType } from "../helpers/validators/contentType";
import { maxFileSize } from "../helpers/validators/maxFileSize";
import { contextUserIsAdmin } from "../users/authorizers";

export const updateOrganizationLogo = mutationField("updateOrganizationLogo", {
  description: "Updates the logo of an organization",
  type: "Organization",
  args: {
    file: nonNull(uploadArg()),
  },
  authorize: authenticateAnd(contextUserIsAdmin()),
  validateArgs: validateAnd(
    contentType((args) => args.file, "image/png", "file"),
    maxFileSize((args) => args.file, 50 * 1024, "file")
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

    return await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      { logo_public_file_id: logoFile.id },
      `User:${ctx.user!.id}`
    );
  },
});

export const updateOrganizationPreferredTone = mutationField("updateOrganizationPreferredTone", {
  description: "Changes the organization preferred tone",
  type: "Organization",
  args: {
    tone: nonNull(arg({ type: "Tone" })),
  },
  authorize: authenticateAnd(contextUserIsAdmin()),
  resolve: async (root, args, ctx) => {
    return await ctx.organizations.updateOrganization(
      ctx.user!.org_id,
      { preferred_tone: args.tone },
      `User:${ctx.user!.id}`
    );
  },
});
