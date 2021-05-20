import {
  mutationField,
  arg,
  booleanArg,
  stringArg,
  nonNull,
  list,
} from "@nexus/schema";
import {
  chain,
  and,
  authenticate,
  ifArgDefined,
  authenticateAnd,
} from "../../helpers/authorize";
import { userHasAccessToPetitions } from "../authorizers";
import { userHasAccessToUsers } from "./authorizers";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { validateAnd, validateIf } from "../../helpers/validateArgs";
import { userIdNotIncludedInArray } from "../../helpers/validators/notIncludedInArray";
import { maxLength } from "../../helpers/validators/maxLength";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { ArgValidationError, WhitelistedError } from "../../helpers/errors";
import { isDefined } from "../../../util/remedaExtensions";
import { validBooleanValue } from "../../helpers/validators/validBooleanValue";
import { userHasAccessToUserGroup } from "../../user-group/authorizers";
import { partition } from "../../../util/arrays";

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
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionIds", ["OWNER"]),
      ifArgDefined("userIds", userHasAccessToUsers("userIds" as never)),
      ifArgDefined(
        "userGroupIds",
        userHasAccessToUserGroup("userGroupIds" as never)
      )
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: list(nonNull(globalIdArg("User"))),
      userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
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
      maxLength((args) => args.message, "message", 1000),
      notEmptyArray((args) => args.userGroupIds, "userGroupId"),
      (_, args, ctx, info) => {
        if (!isDefined(args.userIds) && !isDefined(args.userGroupIds)) {
          throw new ArgValidationError(
            info,
            "userIds, userGroupIds",
            "Either userIds or userGroupIds must be defined"
          );
        }
      }
    ),
    resolve: async (_, args, ctx) => {
      const currentPermissions = (
        await ctx.petitions.loadEffectiveUserPermissions(args.petitionIds)
      ).flat();
      const { petitions, newPermissions } = await ctx.petitions.withTransaction(
        async (t) => {
          const { petitions, newPermissions } =
            await ctx.petitions.addPetitionUserPermissions(
              args.petitionIds,
              args.userIds ?? [],
              args.userGroupIds ?? [],
              args.permissionType,
              ctx.user!,
              t
            );

          const [directlyAssigned, groupAssigned] = partition(
            newPermissions,
            (p) => p.from_user_group_id === null
          );

          await Promise.all([
            directlyAssigned.length > 0
              ? ctx.petitions.createEvent(
                  directlyAssigned.map((p) => ({
                    petitionId: p.petition_id,
                    type: "USER_PERMISSION_ADDED",
                    data: {
                      user_id: ctx.user!.id,
                      permission_type: p.permission_type,
                      permission_user_id: p.user_id!,
                    },
                  })),
                  t
                )
              : undefined,
            groupAssigned.length > 0
              ? ctx.petitions.createEvent(
                  groupAssigned.map((p) => ({
                    petitionId: p.petition_id,
                    type: "GROUP_PERMISSION_ADDED",
                    data: {
                      user_id: ctx.user!.id,
                      permission_type: p.permission_type,
                      user_group_id: p.user_group_id!,
                    },
                  }))
                )
              : undefined,
          ]);

          return { petitions, newPermissions };
        }
      );

      if (args.notify) {
        /** we have to notify only those users who didn't have any permission before */
        const newUserPermissions = newPermissions.filter(
          (np) =>
            !currentPermissions.some(
              (cp) =>
                cp.petition_id === np.petition_id && cp.user_id === np.user_id
            )
        );
        ctx.emails.sendPetitionSharingNotificationEmail(
          ctx.user!.id,
          newUserPermissions.map((p) => p.id),
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
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionIds", ["OWNER"]),
      ifArgDefined("userIds", userHasAccessToUsers("userIds" as never)),
      ifArgDefined(
        "userGroupIds",
        userHasAccessToUserGroup("userGroupIds" as never)
      )
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: list(nonNull(globalIdArg("User"))),
      userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
      permissionType: nonNull(arg({ type: "PetitionUserPermissionType" })),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds"),
      notEmptyArray((args) => args.userGroupIds, "userGroupId"),
      (_, args, ctx, info) => {
        if (!isDefined(args.userIds) && !isDefined(args.userGroupIds)) {
          throw new ArgValidationError(
            info,
            "userIds, userGroupIds",
            "Either userIds or userGroupIds must be defined"
          );
        }
      }
    ),
    resolve: async (_, args, ctx) => {
      try {
        return await ctx.petitions.editPetitionUserPermissions(
          args.petitionIds,
          args.userIds ?? [],
          args.userGroupIds ?? [],
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
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionIds", ["OWNER"]),
      ifArgDefined("userIds", userHasAccessToUsers("userIds" as never)),
      ifArgDefined(
        "userGroupIds",
        userHasAccessToUsers("userGroupIds" as never)
      )
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: list(nonNull(globalIdArg("User"))),
      userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
      removeAll: booleanArg({
        description:
          "Set to true if you want to remove all permissions on the petitions. This will ignore the provided userIds",
      }),
    },
    validateArgs: validateAnd(
      notEmptyArray((args) => args.petitionIds, "petitionIds"),
      notEmptyArray((args) => args.userIds, "userIds"),
      userIdNotIncludedInArray((args) => args.userIds, "userIds"),
      validateIf(
        (args) => !isDefined(args.userIds) && !isDefined(args.userGroupIds),
        validBooleanValue((args) => args.removeAll, "removeAll", true)
      ),
      notEmptyArray((args) => args.userGroupIds, "userGroupId")
    ),
    resolve: async (_, args, ctx) => {
      return await ctx.petitions.removePetitionUserPermissions(
        args.petitionIds,
        args.userIds ?? [],
        args.userGroupIds ?? [],
        args.removeAll ?? false,
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
      await ctx.petitions.updatePetitionUserSubscription(
        petitionId,
        isSubscribed,
        ctx.user!
      );

      return (await ctx.petitions.loadPetition(petitionId))!;
    },
  }
);
