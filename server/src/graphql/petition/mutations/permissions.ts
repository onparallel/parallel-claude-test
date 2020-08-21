import { mutationField, idArg, arg } from "@nexus/schema";
import { chain, and, authenticate } from "../../helpers/authorize";
import { userHasAccessToPetitions } from "../authorizers";
import { userHasAccessToUsers } from "./authorizers";
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
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userId")
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

export const addPetitionUserPermission = mutationField(
  "addPetitionUserPermission",
  {
    description: "Adds permissions on given petitions and users",
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
        type: "PetitionUserPermissionTypeRW",
        required: true,
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

      const { petitions } = await ctx.petitions.addPetitionUserPermissions(
        petitionIds,
        userIds,
        args.permissionType,
        ctx.user!
      );

      return petitions;
    },
  }
);

export const editPetitionUserPermission = mutationField(
  "editPetitionUserPermission",
  {
    description: "Edits permissions on given petitions and users",
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
        required: true,
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

      return await ctx.petitions.editPetitionUserPermissions(
        petitionIds,
        userIds,
        args.permissionType,
        ctx.user!
      );
    },
  }
);

export const removePetitionUserPermission = mutationField(
  "removePetitionUserPermission",
  {
    description: "Removes permissions on given petitions and users",
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
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds")
    ),
    resolve: async (_, args, ctx) => {
      const { ids: petitionIds } = fromGlobalIds(args.petitionIds, "Petition");
      const { ids: userIds } = fromGlobalIds(args.userIds, "User");

      return await ctx.petitions.removePetitionUserPermissions(
        petitionIds,
        userIds,
        ctx.user!
      );
    },
  }
);
