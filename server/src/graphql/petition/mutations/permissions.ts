import {
  mutationField,
  arg,
  booleanArg,
  stringArg,
  nonNull,
  list,
} from "@nexus/schema";
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
    description:
      "Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions.",
    type: list(nonNull("Petition")),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userId")
      )
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userId: nonNull(globalIdArg("User")),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds")
    ),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.transferOwnership(
        args.petitionIds,
        args.userId,
        true,
        ctx.user!
      );
    },
  }
);

export const addPetitionUserPermission = mutationField(
  "addPetitionUserPermission",
  {
    description: "Adds permissions on given petitions and users",
    type: list(nonNull("Petition")),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userIds")
      )
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: nonNull(list(nonNull(globalIdArg("User")))),
      permissionType: nonNull(arg({ type: "PetitionUserPermissionTypeRW" })),
      notify: booleanArg({
        description: "Wether to notify the user via email or not.",
        default: false,
      }),
      message: stringArg(),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds"),
      maxLength((args) => args.message, "message", 1000)
    ),
    resolve: async (_, args, ctx) => {
      const { petitions, newPermissions } = await ctx.petitions.withTransaction(
        async (t) => {
          const {
            petitions,
            newPermissions,
          } = await ctx.petitions.addPetitionUserPermissions(
            args.petitionIds,
            args.userIds,
            args.permissionType,
            ctx.user!,
            t
          );

          await ctx.petitions.createEvent(
            newPermissions.map((p) => ({
              petitionId: p.petition_id,
              type: "USER_PERMISSION_ADDED",
              data: {
                user_id: ctx.user!.id,
                permission_type: p.permission_type,
                permission_user_id: p.user_id,
              },
            })),
            t
          );

          return { petitions, newPermissions };
        }
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
    type: list(nonNull("Petition")),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userIds")
      )
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: nonNull(list(nonNull(globalIdArg("User")))),
      permissionType: nonNull(arg({ type: "PetitionUserPermissionType" })),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds")
    ),
    resolve: async (_, args, ctx) => {
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
    type: list(nonNull("Petition")),
    authorize: chain(
      authenticate(),
      and(
        userHasAccessToPetitions("petitionIds", ["OWNER"]),
        userHasAccessToUsers("userIds")
      )
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: nonNull(list(nonNull(globalIdArg("User")))),
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

export const updatePetitionUserSubscription = mutationField(
  "updatePetitionUserSubscription",
  {
    description: "Updates the subscription flag on a PetitionUser",
    type: "Petition",
    authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      isSubscribed: nonNull(booleanArg()),
    },
    resolve: async (_, { petitionId, isSubscribed }, ctx) => {
      await ctx.petitions.updatePetitionUser(
        petitionId,
        {
          is_subscribed: isSubscribed,
        },
        ctx.user!
      );

      return (await ctx.petitions.loadPetition(petitionId))!;
    },
  }
);
