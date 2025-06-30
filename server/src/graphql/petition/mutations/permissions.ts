import { booleanArg, list, mutationField, nonNull } from "nexus";
import { Petition } from "../../../db/__types";
import { authenticate, authenticateAnd, chain } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { validateAnd } from "../../helpers/validateArgs";
import { notEmptyArray } from "../../helpers/validators/notEmptyArray";
import { userHasAccessToPetitions } from "../authorizers";
import { userHasAccessToUsers } from "./authorizers";

export const transferPetitionOwnership = mutationField("transferPetitionOwnership", {
  description:
    "Transfers petition ownership to a given user. The original owner gets a WRITE permission on the petitions.",
  type: list(nonNull("PetitionBase")),
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionIds", ["OWNER"]),
    userHasAccessToUsers("userId"),
  ),

  args: {
    petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
    userId: nonNull(globalIdArg("User")),
  },
  validateArgs: validateAnd(notEmptyArray("petitionIds")),
  resolve: async (_, args, ctx) => {
    const transferredPermissions = await ctx.petitions.transferOwnership(
      args.petitionIds,
      args.userId,
      true,
      `User:${ctx.user!.id}`,
    );

    await ctx.petitions.createEvent(
      transferredPermissions.map((p) => ({
        petition_id: p.petition_id,
        type: "OWNERSHIP_TRANSFERRED",
        data: {
          user_id: ctx.user!.id,
          previous_owner_id: p.previous_owner_id,
          owner_id: args.userId,
        },
      })),
    );

    return (await ctx.petitions.loadPetition(args.petitionIds)) as Petition[];
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
  },
);
