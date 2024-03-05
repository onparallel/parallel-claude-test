import { list, nonNull, nullable, queryField } from "nexus";
import { authenticate } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";

export const SubscriptionsQuery = queryField("subscriptions", {
  type: nonNull(list("EventSubscription")),
  authorize: authenticate(),
  resolve: async (root, _, ctx) =>
    await ctx.subscriptions.loadEventSubscriptionsByUserId(ctx.user!.id),
});

export const PetitionEventsQuery = queryField("petitionEvents", {
  type: nonNull(list("PetitionEvent")),
  authorize: authenticate(),
  args: {
    eventTypes: list(nonNull("PetitionEventType")),
    before: nullable(
      globalIdArg("PetitionEvent", {
        description: "Filter events that happened before the specified event id",
      }),
    ),
  },
  resolve: async (root, { before, eventTypes }, ctx) => {
    return await ctx.petitions.getPetitionEventsForUser(ctx.user!.id, {
      limit: 10,
      before,
      eventTypes,
    });
  },
});

export const ProfileEventsQuery = queryField("profileEvents", {
  type: nonNull(list("ProfileEvent")),
  authorize: authenticate(),
  args: {
    eventTypes: list(nonNull("ProfileEventType")),
    before: nullable(
      globalIdArg("ProfileEvent", {
        description: "Filter events that happened before the specified event id",
      }),
    ),
  },
  resolve: async (root, { before, eventTypes }, ctx) => {
    return await ctx.profiles.getProfileEventsForUser(ctx.user!.id, {
      limit: 10,
      before,
      eventTypes,
    });
  },
});
