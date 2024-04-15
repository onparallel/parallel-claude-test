import { booleanArg, list, mutationField, nonNull } from "nexus";
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
  validateArgs: validateAnd(notEmptyArray((args) => args.petitionIds, "petitionIds")),
  resolve: async (_, args, ctx) => {
    return await ctx.petitions.transferOwnership(args.petitionIds, args.userId, true, ctx.user!);
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
