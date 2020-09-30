import { arg, idArg, intArg, mutationField, stringArg } from "@nexus/schema";
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
    userId: intArg({
      required: true,
      description: "ID of the user",
    }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
      const petition = await ctx.petitions.loadPetition(petitionId);
      if (!petition) {
        throw `Petition ${args.petitionId} not found`;
      }
      const user = await ctx.users.loadUser(args.userId);
      if (!user) {
        throw `User ${args.userId} not found`;
      }
      const newPetition = await ctx.petitions.clonePetition(petitionId, user);

      return {
        result: RESULT.SUCCESS,
        message: `Petition successfully assigned to ${user.first_name} ${user.last_name}, new id: ${newPetition.id}`,
      };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

export const deletePetition = mutationField("deletePetition", {
  description: "Soft-deletes any given petition on the database.",
  type: "SupportMethodResponse",
  args: {
    petitionId: idArg({
      required: true,
      description: "Global ID of the petition",
    }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args, ctx) => {
    try {
      const { id: petitionId } = fromGlobalId(args.petitionId, "Petition");
      const petition = await ctx.petitions.loadPetition(petitionId);
      if (!petition) {
        throw `Petition ${args.petitionId} not found.`;
      }

      await ctx.petitions.withTransaction(async (t) => {
        await ctx.petitions.deleteUserPermissions([petitionId], ctx.user!, t);
        await ctx.petitions.deletePetitionById(petitionId, ctx.user!, t);
      });
      return {
        result: RESULT.SUCCESS,
        message: `Petition ${args.petitionId} deleted.`,
      };
    } catch (e) {
      return { result: RESULT.FAILURE, message: e.toString() };
    }
  },
});

export const createOrganization = mutationField("createOrganization", {
  description: "Creates a new organization.",
  type: "SupportMethodResponse",
  args: {
    name: stringArg({ required: true }),
    identifier: stringArg({ required: true }),
    status: arg({ type: "OrganizationStatus", required: true }),
  },
  authorize: chain(authenticate(), userBelongsToOrg("parallel", ["ADMIN"])),
  resolve: async (_, args, ctx) => {
    try {
      const identifier = args.identifier.trim().toLowerCase();
      if (identifier.indexOf(" ") > -1) {
        throw "Identifier must not contain spaces.";
      }

      const org = await ctx.organizations.createOrganization(
        {
          name: args.name.trim(),
          identifier,
          status: args.status,
        },
        ctx.user!
      );
      return {
        result: RESULT.SUCCESS,
        message: `Organization created with id ${org.id}`,
      };
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
