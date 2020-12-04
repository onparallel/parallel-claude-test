import { mutationField, arg, booleanArg, stringArg } from "@nexus/schema";
import { chain, and, authenticate } from "../../helpers/authorize";
import { userHasAccessToPetitions } from "../authorizers";
import { userHasAccessToUsers } from "./authorizers";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { validateAnd } from "../../helpers/validateArgs";
import { userIdNotIncludedInArray } from "../../helpers/validators/notIncludedInArray";
import { maxLength } from "../../helpers/validators/maxLength";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { WhitelistedError } from "../../helpers/errors";

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
      petitionIds: globalIdArg("Petition", { required: true, list: [true] }),
      userId: globalIdArg("User", { required: true }),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds")
    ),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.transferOwnership(
        args.petitionIds,
        args.userId,
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
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userIds")
      )
    ),
    args: {
      petitionIds: globalIdArg("Petition", { required: true, list: [true] }),
      userIds: globalIdArg("User", { required: true, list: [true] }),
      permissionType: arg({
        type: "PetitionUserPermissionTypeRW",
        required: true,
      }),
      notify: booleanArg({
        description: "Wether to notify the user via email or not.",
        required: false,
        default: false,
      }),
      message: stringArg({
        required: false,
      }),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds"),
      maxLength((args) => args.message, "message", 1000)
    ),
    resolve: async (_, args, ctx) => {
      const {
        petitions,
        newPermissions,
      } = await ctx.petitions.addPetitionUserPermissions(
        args.petitionIds,
        args.userIds,
        args.permissionType,
        ctx.user!
      );
      if (args.notify) {
        ctx.emails.sendPetitionSharingNotificationEmail(
          ctx.user!.id,
          newPermissions.map((p) => p.id),
          args.message ?? null
        );
      }
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
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userIds")
      )
    ),
    args: {
      petitionIds: globalIdArg("Petition", { required: true, list: [true] }),
      userIds: globalIdArg("User", { required: true, list: [true] }),
      permissionType: arg({
        type: "PetitionUserPermissionType",
        required: true,
      }),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds")
    ),
    resolve: async (_, args, ctx, info) => {
      try {
        return await ctx.petitions.editPetitionUserPermissions(
          args.petitionIds,
          args.userIds,
          args.permissionType,
          ctx.user!
        );
      } catch (e) {
        if (e.constraint === "petition_user__owner") {
          throw new WhitelistedError(
            "A petition can't have more than one owner.",
            "PETITION_OWNER_CONSTRAINT_ERROR"
          );
        } else {
          throw e;
        }
      }
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
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userIds")
      )
    ),
    args: {
      petitionIds: globalIdArg("Petition", { required: true, list: [true] }),
      userIds: globalIdArg("User", { required: true, list: [true] }),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds")
    ),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.removePetitionUserPermissions(
        args.petitionIds,
        args.userIds,
        ctx.user!
      );
    },
  }
);
