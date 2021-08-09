import { booleanArg, list, mutationField, nonNull } from "@nexus/schema";
import { outdent } from "outdent";
import { xorDefined } from "../../util/remedaExtensions";
import { authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import {
  userHasAccessToPetitionFieldComments,
  userHasAccessToPetitions,
} from "../petition/authorizers";
import { userHasAccessToNotifications } from "./authorizers";

export const updatePetitionUserNotificationReadStatus = mutationField(
  "updatePetitionUserNotificationReadStatus",
  {
    description: outdent`
      Updates the read status of a user's notification. 
      Must pass ONLY one of:
        - petitionUserNotificationIds
        - filter
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
        userHasAccessToPetitionFieldComments("petitionFieldCommentIds" as never)
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
      if (
        !xorDefined(
          args.petitionUserNotificationIds,
          args.petitionIds,
          args.petitionFieldCommentIds,
          args.filter
        )
      ) {
        throw new ArgValidationError(
          info,
          "args.petitionUserNotificationIds, args.petitionIds, args.petitionFieldCommentIds, args.filter",
          "Only one of `petitionUserNotificationIds`, `petitionIds`, `petitionFieldCommentIds` or `filter` argument should be defined"
        );
      }
    },
    resolve: async (
      _,
      { petitionUserNotificationIds, petitionIds, petitionFieldCommentIds, filter, isRead },
      ctx
    ) => {
      if (petitionUserNotificationIds) {
        return await ctx.petitions.updatePetitionUserNotificationsReadStatus(
          petitionUserNotificationIds,
          isRead,
          ctx.user!.id
        );
      } else if (petitionIds) {
        return await ctx.petitions.updatePetitionUserNotificationsReadStatusByPetitionId(
          petitionIds,
          isRead,
          ctx.user!.id
        );
      } else if (petitionFieldCommentIds) {
        return await ctx.petitions.updatePetitionUserNotificationsReadStatusByCommentIds(
          petitionFieldCommentIds,
          isRead,
          ctx.user!.id
        );
      } else {
        return await ctx.petitions.updatePetitionUserNotificationsReadStatusByUserId(
          filter!,
          isRead,
          ctx.user!.id
        );
      }
    },
  }
);
