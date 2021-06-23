import { booleanArg, list, mutationField, nonNull } from "@nexus/schema";
import { outdent } from "outdent";
import { isDefined } from "../../util/remedaExtensions";
import { authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToNotifications } from "./authorizers";

export const updatePetitionUserNotificationReadStatus = mutationField(
  "updatePetitionUserNotificationReadStatus",
  {
    description: outdent`
      Updates the read status of a user's notification. 
      Must pass either petitionUserNotificationIds or filter argument.
      If petitionUserNotificationIds is provided, filter argument will be ignored.
    `,
    type: nonNull(list(nonNull("PetitionUserNotification"))),
    authorize: authenticateAnd(
      ifArgDefined(
        "petitionUserNotificationIds",
        userHasAccessToNotifications("petitionUserNotificationIds" as never)
      )
    ),
    args: {
      petitionUserNotificationIds: list(
        nonNull(globalIdArg("PetitionUserNotification"))
      ),
      filter: "PetitionUserNotificationFilter",
      isRead: nonNull(booleanArg()),
    },
    validateArgs: async (root, args, ctx, info) => {
      if (
        !isDefined(args.petitionUserNotificationIds) &&
        !isDefined(args.filter)
      ) {
        throw new ArgValidationError(
          info,
          "petitionUserNotificationIds, filter",
          "Either `petitionUserNotificationIds` or `filter` argument must be defined"
        );
      }
    },
    resolve: async (
      _,
      { petitionUserNotificationIds, isRead, filter },
      ctx
    ) => {
      if (petitionUserNotificationIds) {
        return await ctx.petitions.updatePetitionUserNotificationsReadStatus(
          petitionUserNotificationIds,
          isRead
        );
      } else {
        return await ctx.petitions.updatePetitionUserNotificationsReadStatusByUserId(
          ctx.user!.id,
          isRead,
          filter
        );
      }
    },
  }
);
