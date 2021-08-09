import { mutationField, nonNull } from "@nexus/schema";
import { random } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { uploadArg } from "../helpers/upload";
import { validateAnd } from "../helpers/validateArgs";
import { contentType } from "../helpers/validators/contentType";
import { maxFileSize } from "../helpers/validators/maxFileSize";
import { contextUserIsAdmin } from "../users/authorizers";
import { contextUserBelongsToOrg } from "./authorizers";

export const updateOrganizationLogo = mutationField("updateOrganizationLogo", {
  description: "Updates the logo of an organization",
  type: "Organization",
  args: {
    orgId: nonNull(globalIdArg()),
    file: nonNull(uploadArg()),
  },
  authorize: authenticateAnd(
    contextUserIsAdmin(),
    contextUserBelongsToOrg("orgId")
  ),
  validateArgs: validateAnd(
    contentType((args) => args.file, "image/png", "file"),
    maxFileSize((args) => args.file, 50 * 1024, "file")
  ),
  resolve: async (root, args, ctx) => {
    const { mimetype, createReadStream } = await args.file;
    const filename = random(16);
    const path = `uploads/${filename}`;

    const res = await ctx.aws.publicFiles.uploadFile(
      path,
      mimetype,
      createReadStream()
    );

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
      args.orgId,
      { logo_public_file_id: logoFile.id },
      ctx.user!
    );
  },
});
