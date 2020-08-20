import { mutationField, idArg, arg } from "@nexus/schema";
import { chain, and, authenticate } from "../../helpers/authorize";
import { userHasAccessToPetitions } from "../authorizers";
import {
  userHasAccessToUsers,
  userHasPermissionOnPetitions,
} from "./authorizers";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { validateAnd } from "../../helpers/validateArgs";
import { userIdNotIncludedInArray } from "../../helpers/validators/notIncludedInArray";
import { fromGlobalIds, fromGlobalId } from "../../../util/globalId";

export const transferPetitionOwnership = mutationField(
  "transferPetitionOwnership",
  {
    description: "Transfers petition ownership to a given user",
    type: "Petition",
    list: [true],
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionIds"),
        userHasAccessToUsers("userId"),
        userHasPermissionOnPetitions("petitionIds", ["OWNER"])
      )
    ),
    args: {
      petitionIds: idArg({ required: true, list: [true] }),
      userId: idArg({ required: true }),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds")
    ),
    resolve: async (_, args, ctx) => {
      const { ids: petitionIds } = fromGlobalIds(args.petitionIds, "Petition");
      const { id: userId } = fromGlobalId(args.userId, "User");

      return await ctx.petitions.transferOwnership(
        petitionIds,
        userId,
        ctx.user!
      );
    },
  }
);

export const addOrChangePetitionUserPermission = mutationField(
  "addOrChangePetitionUserPermission",
  {
    description: "Adds or edits permissions on given petitions and users",
    type: "Petition",
    list: [true],
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionIds"),
        userHasAccessToUsers("userIds"),
        userHasPermissionOnPetitions("petitionIds", ["OWNER", "WRITE"])
      )
    ),
    args: {
      petitionIds: idArg({ required: true, list: [true] }),
      userIds: idArg({ required: true, list: [true] }),
      permissionType: arg({
        type: "PetitionUserPermissionType",
        required: false,
      }),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds")
    ),
    resolve: async (_, args, ctx) => {
      const { ids: petitionIds } = fromGlobalIds(args.petitionIds, "Petition");
      const { ids: userIds } = fromGlobalIds(args.userIds, "User");

      if (args?.permissionType === "OWNER") {
        throw new Error("permissionType has to be READ or WRITE");
      }
      if (args.permissionType) {
        return await ctx.petitions.addOrChangePetitionUserPermissions(
          petitionIds,
          userIds,
          args.permissionType,
          ctx.user!
        );
      } else {
        return await ctx.petitions.removePetitionUserPermissions(
          petitionIds,
          userIds,
          ctx.user!
        );
      }
    },
  }
);
