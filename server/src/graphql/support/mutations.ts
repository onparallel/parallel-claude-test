import { idArg, mutationField } from "@nexus/schema";
import { fromGlobalId } from "../../util/globalId";
import { authenticate, chain } from "../helpers/authorize";
import { RESULT } from "../helpers/result";
import { userBelongsToOrg } from "./authorizers";

export const assignPetitionToUser = mutationField("assignPetitionToUser", {
  description:
    "Clones the petition and assigns the given user as owner and creator.",
  type: "SupportMethodResponse",
  args: {
    petitionId: idArg({
      required: true,
      description: "Global ID of the petition",
    }),
    userId: idArg({
      required: true,
      description: "Global ID of the user",
    }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(args.petitionId);
      const { id: userId } = fromGlobalId(args.userId, "User");
      const petition = await ctx.petitions.loadPetition(petitionId);
      if (!petition) {
        throw `Petition ${args.petitionId} not found`;
      }
      const user = await ctx.users.loadUser(userId);
      if (!user) {
        throw `User ${args.userId} not found`;
      }
      await ctx.petitions.clonePetition(petitionId, user);

      return { result: RESULT.SUCCESS };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

// export const uploadOrgLogo = mutationField("uploadOrganizationLogo", {
//   description: "Uploads a logo for an organization.",
//   type: "SupportMethodResponse",
//   args: {
//     orgId: arg({ type: "Int", required: true }),
//     logo: arg({ type: "Upload", required: true }),
//   },
//   validateArgs: fileIsImage((args) => args.logo, "logo"),
//   authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
//   resolve: async (_, args, ctx) => {
//     const org = await ctx.organizations.loadOrg(args.orgId);
//     if (!org) {
//       throw new WhitelistedError(
//         `Organization with id ${args.orgId} not found`,
//         "ORGANIZATION_NOT_FOUND"
//       );
//     }

//     const file = await (args.logo as Promise<UploadedFile>);
//     console.log(file);

//     return {
//       result: RESULT.SUCCESS,
//     };
//   },
// });
