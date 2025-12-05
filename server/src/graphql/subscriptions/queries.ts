import { intArg, list, nonNull, nullable, queryField } from "nexus";
import { authenticate } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { inRange } from "../helpers/validators/inRange";

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
    fromTemplateId: nullable(globalIdArg("Petition")),
    eventTypes: list(nonNull("PetitionEventType")),
    before: nullable(
      globalIdArg("PetitionEvent", {
        description: "Filter events that happened before the specified event id",
      }),
    ),
    limit: nullable(intArg()),
  },
  validateArgs: inRange("limit", 0, 100),
  resolve: async (_, { before, eventTypes, fromTemplateId, limit }, ctx) => {
    return await ctx.petitions.getPetitionEventsForUser(ctx.user!.id, {
      limit: limit ?? 10,
      before,
      eventTypes,
      fromTemplateId,
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
