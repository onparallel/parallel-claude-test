import { arg, intArg, list, nonNull, queryField } from "@nexus/schema";
import { authenticate } from "../../api/helpers/authenticate";
import { datetimeArg } from "../helpers/date";

export const notifications = queryField("notifications", {
  type: nonNull(list(nonNull("PetitionUserNotification"))),
  args: {
    limit: nonNull(intArg()),
    filter: arg({ type: "PetitionUserNotificationFilter" }),
    before: datetimeArg(),
  },
  authorize: authenticate(),
  resolve: async (_, { limit, filter, before }, ctx) => {
    return await ctx.petitions.loadPetitionUserNotificationsByUserId(
      ctx.user!.id,
      limit,
      filter,
      before
    );
  },
});
