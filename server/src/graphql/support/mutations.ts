import { arg, mutationField } from "@nexus/schema";
import { authenticate, chain } from "../helpers/authorize";
import { RESULT } from "../helpers/result";
import { fileIsImage } from "../helpers/validators/fileIsImage";
import { userBelongsToOrg } from "./authorizers";
import { writeFile } from "./helpers";
import { resolve as resolvePath } from "path";

export const assignPetitionToUser = mutationField("assignPetitionToUser", {
  description: "Assigns any valid petition to a given user.",
  type: "SupportMethodResponse",
  args: {
    petitionId: arg({ type: "Int", required: true }),
    userId: arg({ type: "Int", required: true }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args, ctx) => {
    const petition = await ctx.petitions.loadPetition(args.petitionId);
    const user = await ctx.users.loadUser(args.userId);
    console.log(petition, user);
    return args.petitionId === 1
      ? { result: RESULT.SUCCESS, message: "User assigned" }
      : { result: RESULT.FAILURE, message: "an error happened" };
  },
});

export const uploadOrgLogo = mutationField("uploadOrganizationLogo", {
  description: "Uploads a logo for an organization.",
  type: "SupportMethodResponse",
  args: {
    orgId: arg({ type: "Int", required: true }),
    logo: arg({ type: "Upload", required: true }),
  },
  validateArgs: fileIsImage((args) => args.logo, "logo"),
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args, ctx) => {
    const path = await writeFile(await args.logo);
    return {
      result: RESULT.SUCCESS,
      message: `file written on ${resolvePath(path)}`,
    };
  },
});
