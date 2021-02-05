import { mutationField, nonNull } from "@nexus/schema";
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
    maxFileSize((args) => args.file, 50000, "file")
  ),
  resolve: async (root, args, ctx) => {
    const file = await args.file;
    const organization = (await ctx.organizations.loadOrg(args.orgId))!;

    const {
      Location,
    } = await ctx.aws.publicFiles.uploadFile(
      `logos/${organization.identifier}.png`,
      file.mimetype,
      file.createReadStream(),
      { ACL: "public-read" }
    );

    return await ctx.organizations.updateOrgLogo(
      args.orgId,
      Location,
      ctx.user!
    );
  },
});
