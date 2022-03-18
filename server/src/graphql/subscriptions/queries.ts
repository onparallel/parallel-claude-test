import { list, nonNull, nullable, queryField } from "nexus";
import { authenticate } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";

export const SubscriptionsQuery = queryField("subscriptions", {
  type: nonNull(list("PetitionEventSubscription")),
  authorize: authenticate(),
  resolve: async (root, _, ctx) => await ctx.subscriptions.loadSubscriptionsByUserId(ctx.user!.id),
});

export const PetitionEventsQuery = queryField("petitionEvents", {
  type: nonNull(list("PetitionEvent")),
  authorize: authenticate(),
  args: {
    before: nullable(
      globalIdArg("PetitionEvent", {
        description: "Filter events that happened before the specified event id",
      })
    ),
  },
  resolve: async (root, { before }, ctx) => {
    return await ctx.petitions.getPetitionEventsForUser(ctx.user!.id, { limit: 10, before });
  },
});
