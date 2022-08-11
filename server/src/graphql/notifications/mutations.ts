import { booleanArg, list, mutationField, nonNull } from "nexus";
import { outdent } from "outdent";
import { isDefined, sortBy } from "remeda";
import { PetitionUserNotification } from "../../db/notifications";
import { authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import {
  userHasAccessToPetitionFieldComment,
  userHasAccessToPetitions,
} from "../petition/authorizers";
import { userHasAccessToNotifications } from "./authorizers";

export const updatePetitionUserNotificationReadStatus = mutationField(
  "updatePetitionUserNotificationReadStatus",
  {
    description: outdent`
      Updates the read status of a user's notification. 
      If one of the following args is defined, the other two must be undefined:
        - petitionUserNotificationIds
        - petitionIds
        - petitionFieldCommentIds
    `,
    type: nonNull(list(nonNull("PetitionUserNotification"))),
    authorize: authenticateAnd(
      ifArgDefined(
        "petitionUserNotificationIds",
        userHasAccessToNotifications("petitionUserNotificationIds" as never)
      ),
      ifArgDefined("petitionIds", userHasAccessToPetitions("petitionIds" as never)),
      ifArgDefined(
        "petitionFieldCommentIds",
        userHasAccessToPetitionFieldComment("petitionFieldCommentIds" as never)
      )
    ),
    args: {
      petitionUserNotificationIds: list(nonNull(globalIdArg("PetitionUserNotification"))),
      filter: "PetitionUserNotificationFilter",
      petitionIds: list(nonNull(globalIdArg("Petition"))),
      petitionFieldCommentIds: list(nonNull(globalIdArg("PetitionFieldComment"))),
      isRead: nonNull(booleanArg()),
    },
    validateArgs: async (root, args, ctx, info) => {
      const argCount = [
        args.petitionUserNotificationIds,
        args.petitionIds,
        args.petitionFieldCommentIds,
      ].reduce((result, element) => (isDefined(element) ? result + 1 : result), 0);

      if (argCount > 1) {
        throw new ArgValidationError(
          info,
          "args.petitionUserNotificationIds, args.petitionIds, args.petitionFieldCommentIds",
          "Only one of `petitionUserNotificationIds`, `petitionIds` or `petitionFieldCommentIds` argument should be defined"
        );
      } else if (argCount === 0 && !args.filter) {
        throw new ArgValidationError(
          info,
          "args.petitionUserNotificationIds, args.petitionIds, args.petitionFieldCommentIds, args.filter",
          "Some required argument is missing."
        );
      }
    },
    resolve: async (
      _,
      { petitionUserNotificationIds, petitionIds, petitionFieldCommentIds, filter, isRead },
      ctx,
      info
    ) => {
      let notifications: PetitionUserNotification<false>[] = [];
      if (petitionUserNotificationIds) {
        notifications = await ctx.petitions.updatePetitionUserNotificationsReadStatus(
          petitionUserNotificationIds,
          isRead,
          ctx.user!.id,
          filter
        );
      } else if (petitionIds) {
        notifications = await ctx.petitions.updatePetitionUserNotificationsReadStatusByPetitionId(
          petitionIds,
          isRead,
          ctx.user!.id,
          filter
        );
      } else if (petitionFieldCommentIds) {
        notifications = await ctx.petitions.updatePetitionUserNotificationsReadStatusByCommentIds(
          petitionFieldCommentIds,
          isRead,
          ctx.user!.id,
          filter
        );
      } else if (filter) {
        notifications = await ctx.petitions.updatePetitionUserNotificationsReadStatusByUserId(
          filter,
          isRead,
          ctx.user!.id
        );
      }
      return sortBy(notifications, [(n) => n.created_at, "desc"]);
    },
  }
);
