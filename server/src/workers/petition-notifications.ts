import { differenceInMinutes } from "date-fns";
import { groupBy, sortBy } from "remeda";
import { Config } from "../config";
import { WorkerContext } from "../context";
import {
  PetitionContactNotification,
  PetitionUserNotification,
} from "../db/__types";
import { isDefined } from "../util/remedaExtensions";
import { MaybePromise } from "../util/types";
import { createCronWorker } from "./helpers/createCronWorker";

type PetitionNotification =
  | PetitionUserNotification
  | PetitionContactNotification;

function shouldBeProcessed(
  notifications: PetitionNotification[],
  minutesBeforeNotify: number
) {
  const lastNotification = sortBy(
    notifications,
    (n) => n.created_at
  ).reverse()[0];

  return (
    differenceInMinutes(lastNotification.created_at, new Date()) >
    minutesBeforeNotify
  );
}

/**
 * iterates over an array of unprocessed COMMENT_CREATED user notifications,
 * sending an email to the user with the accumulated comments if the last notification
 * was created more than `config.minutesBeforeNotify` minutes ago
 */
function processCommentCreatedUserNotification(
  context: WorkerContext,
  config: Config["cronWorkers"]["petition-notifications"]
) {
  return async (notifications: PetitionUserNotification[]) => {
    if (shouldBeProcessed(notifications, config.minutesBeforeNotify)) {
      const petitionId = notifications[0].petition_id;
      const userId = notifications[0].user_id;
      const isSubscribed = await context.petitions.isUserSubscribedToPetition(
        userId,
        petitionId
      );
      if (isSubscribed) {
        await context.emails.sendPetitionCommentsUserNotificationEmail(
          petitionId,
          userId,
          notifications.map((n) => n.data.petition_field_comment_id)
        );
      }

      await context.petitions.updatePetitionUserNotifications(
        notifications.map((n) => n.id),
        {
          processed_at: new Date(),
        }
      );
    }
  };
}

/**
 * iterates over an array of unprocessed COMMENT_CREATED contact notifications,
 * sending an email to the contact with the accumulated comments if the last notification
 * was created more than `config.minutesBeforeNotify` minutes ago
 */
function processCommentCreatedContactNotification(
  context: WorkerContext,
  config: Config["cronWorkers"]["petition-notifications"]
) {
  return async (notifications: PetitionContactNotification[]) => {
    if (shouldBeProcessed(notifications, config.minutesBeforeNotify)) {
      const petitionId = notifications[0].petition_id;
      const accessId = notifications[0].petition_access_id;

      await context.emails.sendPetitionCommentsContactNotificationEmail(
        petitionId,
        accessId,
        notifications.map((n) => n.data.petition_field_comment_id)
      );

      await context.petitions.updatePetitionContactNotifications(
        notifications.map((n) => n.id),
        {
          processed_at: new Date(),
        }
      );
    }
  };
}

/**
 * groups the notifications array by recipientId and petitionId, and calls the callback function for each of this groups
 */
async function groupNotifications<T extends PetitionNotification>(
  notifications: T[],
  callback: (groupedItems: T[]) => MaybePromise<void>
) {
  const byRecipientId = groupBy(notifications, (n) =>
    isDefined((n as any).user_id)
      ? (n as any).user_id
      : (n as any).petition_access_id
  );
  for (const notificationsByRecipientId of Object.values(byRecipientId)) {
    const byPetitionId = groupBy(
      notificationsByRecipientId,
      (n) => n.petition_id
    );
    for (const notificationsByPetitionId of Object.values(byPetitionId)) {
      await callback(notificationsByPetitionId);
    }
  }
}

/*
 * this worker reads from tables `petition_user_notification` and `petition_contact_notification`
 * loads every unread and unprocessed entries and tries to process those.
 * For now it only processes COMMENT_CREATED type notifications.
 */
createCronWorker("petition-notifications", async (context, config) => {
  const [unprocessedUserNotifications, unprocessedContactNotifications] =
    await Promise.all([
      context.petitions.loadUnprocessedCommentCreatedUserNotifications(),
      context.petitions.loadUnprocessedCommentCreatedContactNotifications(),
    ]);

  // group unprocessedUserNotifications by (user_id, petition_id)
  // and call processCommentCreatedUserNotification with each of this subgroups
  await groupNotifications(
    unprocessedUserNotifications,
    processCommentCreatedUserNotification(context, config)
  );

  // group unprocessedContactNotifications by (petition_access_id, petition_id)
  // and call processCommentCreatedContactNotification with each of this subgroups
  await groupNotifications(
    unprocessedContactNotifications,
    processCommentCreatedContactNotification(context, config)
  );
});
