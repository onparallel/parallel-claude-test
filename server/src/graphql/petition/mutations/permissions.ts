import { ApolloError } from "apollo-server-core";
import { arg, booleanArg, list, mutationField, nonNull, nullable, stringArg } from "nexus";
import pMap from "p-map";
import { groupBy, isDefined, uniq, zip } from "remeda";
import { and, authenticate, authenticateAnd, chain, ifArgDefined } from "../../helpers/authorize";
import { ArgValidationError } from "../../helpers/errors";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { validateAnd, validateIf } from "../../helpers/validateArgs";
import { maxLength } from "../../helpers/validators/maxLength";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { validBooleanValue } from "../../helpers/validators/validBooleanValue";
import { userHasAccessToUserGroups } from "../../user-group/authorizers";
import { userHasAccessToPetitions } from "../authorizers";
import { userHasAccessToUsers } from "./authorizers";

export const transferPetitionOwnership = mutationField("transferPetitionOwnership", {
  description:
    "Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions.",
  type: list(nonNull("PetitionBase")),
  authorize: chain(
    authenticate(),
    and(userHasAccessToPetitions("petitionIds", ["OWNER"]), userHasAccessToUsers("userId"))
  ),
  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
    userId: nonNull(globalIdArg("User")),
  },
  validateArgs: validateAnd(notEmptyArray((args) => args.petitionIds, "petitionIds")),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.transferOwnership(args.petitionIds, args.userId, true, ctx.user!);
  },
});

export const addPetitionPermission = mutationField("addPetitionPermission", {
  description: "Adds permissions on given parallel and users",
  type: list(nonNull("PetitionBase")),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionIds", ["OWNER", "WRITE"]),
    ifArgDefined("userIds", userHasAccessToUsers("userIds" as never)),
    ifArgDefined("userGroupIds", userHasAccessToUserGroups("userGroupIds" as never))
  ),
  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
    userIds: list(nonNull(globalIdArg("User"))),
    userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
    permissionType: nonNull(arg({ type: "PetitionPermissionTypeRW" })),
    notify: booleanArg({
      description: "Wether to notify the user via email or not.",
      default: false,
    }),
    subscribe: booleanArg({
      description: "Subscribe to notifications.",
      default: true,
    }),
    message: stringArg(),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.petitionIds, "petitionIds"),
    notEmptyArray((args) => args.userIds, "userIds"),
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
      await ctx.petitions.loadEffectivePermissions(args.petitionIds)
    ).flat();

    const { petitions, newPermissions } = await ctx.petitions.addPetitionPermissions(
      args.petitionIds,
      [
        ...(args.userIds ?? []).map((userId) => ({
          type: "User" as const,
          id: userId,
          isSubscribed: args.subscribe ?? true,
          permissionType: args.permissionType,
        })),
        ...(args.userGroupIds ?? []).map((userGroupId) => ({
          type: "UserGroup" as const,
          id: userGroupId,
          isSubscribed: args.subscribe ?? true,
          permissionType: args.permissionType,
        })),
      ],
      "User",
      ctx.user!.id,
      true
    );

    if (args.notify) {
      /** we have to notify only those users who didn't have any permission before */
      const newUserPermissions = newPermissions.filter(
        (np, index) =>
          isDefined(np.user_id) &&
          !currentPermissions.some(
            // make sure the user dont have previous permission on the petition
            (cp) => cp.petition_id === np.petition_id && cp.user_id === np.user_id
          ) &&
          !newPermissions.some(
            // removes duplicated <user_id,petition_id> entries to send only one email per user/petition
            // this can happen when the petition is shared to the user directly and via a group at the same time
            (np2, index2) =>
              np.petition_id === np2.petition_id && np.user_id === np2.user_id && index > index2
          )
      );

      if (newUserPermissions.length > 0) {
        ctx.emails.sendPetitionSharedEmail(
          ctx.user!.id,
          newUserPermissions.map((p) => p.id),
          args.message ?? null
        );
      }
    }
    return petitions;
  },
});

export const editPetitionPermission = mutationField("editPetitionPermission", {
  description: "Edits permissions on given parallel and users",
  type: list(nonNull("Petition")),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionIds", ["OWNER", "WRITE"]),
    ifArgDefined("userIds", userHasAccessToUsers("userIds" as never)),
    ifArgDefined("userGroupIds", userHasAccessToUserGroups("userGroupIds" as never))
  ),
  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
    userIds: list(nonNull(globalIdArg("User"))),
    userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
    permissionType: nonNull(arg({ type: "PetitionPermissionType" })),
  },
  validateArgs: validateAnd(
    notEmptyArray((args) => args.petitionIds, "petitionIds"),
    notEmptyArray((args) => args.userIds, "userIds"),
    notEmptyArray((args) => args.userGroupIds, "userGroupId"),
    (_, args, ctx, info) => {
      if (!isDefined(args.userIds) && !isDefined(args.userGroupIds)) {
        throw new ArgValidationError(
          info,
          "userIds, userGroupIds",
          "Either userIds or userGroupIds must be defined"
        );
      }
    },
    (_, args, ctx, info) => {
      if (args.permissionType === "OWNER") {
        throw new ArgValidationError(info, "permissionType", "Invalid permissionType");
      }
    }
  ),
  resolve: async (_, args, ctx) => {
    try {
      return await ctx.petitions.editPetitionPermissions(
        args.petitionIds,
        args.userIds ?? [],
        args.userGroupIds ?? [],
        args.permissionType,
        ctx.user!
      );
    } catch (e: any) {
      if (e.constraint === "petition_permission__owner") {
        throw new ApolloError(
          "A petition can't have more than one owner.",
          "PETITION_OWNER_CONSTRAINT_ERROR"
        );
      } else {
        throw e;
      }
    }
  },
});

export const removePetitionPermission = mutationField("removePetitionPermission", {
  description: "Removes permissions on given parallel and users",
  type: nonNull(list(nullable("PetitionBase"))),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionIds", ["OWNER", "WRITE"]),
    ifArgDefined("userIds", userHasAccessToUsers("userIds" as never)),
    ifArgDefined("userGroupIds", userHasAccessToUserGroups("userGroupIds" as never))
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
    validateIf(
      (args) => !isDefined(args.userIds) && !isDefined(args.userGroupIds),
      validBooleanValue((args) => args.removeAll, "removeAll", true)
    ),
    notEmptyArray((args) => args.userGroupIds, "userGroupId")
  ),
  resolve: async (_, args, ctx) => {
    const deletedPermissions = await ctx.petitions.removePetitionPermissions(
      args.petitionIds,
      args.userIds ?? [],
      args.userGroupIds ?? [],
      args.removeAll ?? false,
      ctx.user!
    );
    const deletedPermissionsByPetitionId = groupBy(deletedPermissions, (p) => p.petition_id);

    const petitionIds = uniq(deletedPermissions.map((p) => p.petition_id));

    const effectivePermissions = await ctx.petitions.loadEffectivePermissions(petitionIds);

    // For each petition, delete permissions not present in effectivePermissions
    await pMap(
      zip(
        petitionIds.map((id) => deletedPermissionsByPetitionId[id]),
        effectivePermissions
      ),
      async ([deletedPermissions, effectivePermissions]) => {
        const petitionId = deletedPermissions[0].petition_id;
        const hasPermissions = new Set(effectivePermissions.map((p) => p.user_id!));

        // users of deletedPermissions that dont have any effectivePermission lost
        // access to the petitions, their notifications need to be deleted
        const userIds = uniq(
          deletedPermissions
            .filter((p) => p.user_id !== null)
            .map((p) => p.user_id!)
            .filter((userId) => !hasPermissions.has(userId))
        );

        await ctx.petitions.deletePetitionUserNotificationsByPetitionId([petitionId], userIds);
      },
      { concurrency: 20 }
    );

    const accesses = await ctx.petitions.userHasAccessToPetitionsRaw(
      ctx.user!.id,
      args.petitionIds
    );

    return Promise.all(
      zip(args.petitionIds, accesses).map(async ([petitionId, hasAccess]) =>
        hasAccess ? await ctx.petitions.loadPetition(petitionId) : null
      )
    );
  },
});

export const updatePetitionPermissionSubscription = mutationField(
  "updatePetitionPermissionSubscription",
  {
    description: "Updates the subscription flag on a PetitionPermission",
    type: "Petition",
    authorize: chain(authenticate(), userHasAccessToPetitions("petitionId")),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      isSubscribed: nonNull(booleanArg()),
    },
    resolve: async (_, { petitionId, isSubscribed }, ctx) => {
      await ctx.petitions.updatePetitionPermissionSubscription(petitionId, isSubscribed, ctx.user!);

      return (await ctx.petitions.loadPetition(petitionId))!;
    },
  }
);
