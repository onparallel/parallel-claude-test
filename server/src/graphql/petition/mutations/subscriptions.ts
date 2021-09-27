import { mutationField, nonNull, stringArg } from "nexus";
import { authenticateAnd } from "../../helpers/authorize";
import { globalIdArg } from "../../helpers/globalIdPlugin";
import { RESULT } from "../../helpers/result";
import { userHasAccessToPetitions, userHasAccessToSubscriptions } from "../authorizers";

export const createPetitionSubscription = mutationField("createPetitionSubscription", {
  type: "Subscription",
  description: "Creates a new subscription on a petition",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId", ["OWNER"])),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    endpoint: nonNull(
      stringArg({
        description: "URL to receive POST requests with the petition events data",
      })
    ),
  },
  resolve: async (_, { petitionId, endpoint }, ctx) => {
    return await ctx.subscriptions.createSubscription(petitionId, endpoint, ctx.user!);
  },
});

export const deletePetitionSubscription = mutationField("deletePetitionSubscription", {
  type: "Result",
  authorize: authenticateAnd(userHasAccessToSubscriptions("subscriptionId")),
  args: {
    subscriptionId: nonNull(globalIdArg("Subscription")),
  },
  resolve: async (_, { subscriptionId }, ctx) => {
    await ctx.subscriptions.deleteSubscription(subscriptionId, ctx.user!);
    return RESULT.SUCCESS;
  },
});
