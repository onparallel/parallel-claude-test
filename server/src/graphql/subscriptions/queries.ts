import { list, nonNull, queryField } from "nexus";
import { authenticate } from "../helpers/authorize";

export const SubscriptionsQuery = queryField("subscriptions", {
  type: nonNull(list("PetitionEventSubscription")),
  authorize: authenticate(),
  resolve: async (root, _, ctx) => await ctx.subscriptions.loadSubscriptionsByUserId(ctx.user!.id),
});
