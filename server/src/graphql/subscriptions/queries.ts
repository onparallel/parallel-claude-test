import { list, nonNull, queryField } from "nexus";
import { authenticate } from "../helpers/authorize";

export const SubscriptionsQuery = queryField("subscriptions", {
  type: nonNull(list("PetitionEventSubscription")),
  authorize: authenticate(),
  resolve: async (root, _, ctx) => {
    const orgIntegrations = await ctx.integrations.loadIntegrationsByOrgId(
      ctx.user!.org_id,
      "EVENT_SUBSCRIPTION",
      true
    );

    return orgIntegrations.filter((i) => i.settings.USER_ID === ctx.user!.id);
  },
});
