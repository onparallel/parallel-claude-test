import { booleanArg, list, mutationField, nonNull } from "@nexus/schema";
import { authenticateAnd } from "../helpers/authorize";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToNotifications } from "./authorizers";

export const updatePetitionUserNotificationReadStatus = mutationField(
  "updatePetitionUserNotificationReadStatus",
  {
    description: "Updates the read status of a user's notification",
    type: nonNull(list(nonNull("PetitionUserNotification"))),
    authorize: authenticateAnd(
      userHasAccessToNotifications("petitionUserNotificationIds")
    ),
    args: {
      petitionUserNotificationIds: nonNull(
        list(nonNull(globalIdArg("PetitionUserNotification")))
      ),
      filter: "PetitionUserNotificationFilter",
      isRead: nonNull(booleanArg()),
    },
    resolve: async (
      _,
      { petitionUserNotificationIds, isRead, filter },
      ctx
    ) => {
      return await ctx.petitions.updatePetitionUserNotifications(
        petitionUserNotificationIds,
        { is_read: isRead },
        filter
      );
    },
  }
);
