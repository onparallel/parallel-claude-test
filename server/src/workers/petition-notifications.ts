import { differenceInMinutes } from "date-fns";
import { groupBy, maxBy } from "remeda";
import { Config } from "../config";
import { WorkerContext } from "../context";
import { CommentCreatedUserNotification } from "../db/notifications";
import {
  PetitionContactNotification,
  PetitionUserNotification,
} from "../db/__types";
import { createCronWorker } from "./helpers/createCronWorker";

function shouldBeProcessed(
  notifications: (PetitionUserNotification | PetitionContactNotification)[],
  minutesBeforeNotify: number
) {
  const lastNotification = maxBy(notifications, (n) => n.created_at.getTime())!;

  return (
    differenceInMinutes(new Date(), lastNotification.created_at) >
    minutesBeforeNotify
  );
}

/**
 * iterates over an array of unprocessed COMMENT_CREATED user notifications,
 * sending an email to the user with the accumulated comments if the last notification
 * was created more than `config.minutesBeforeNotify` minutes ago
 */
async function processCommentCreatedUserNotification(
  notifications: CommentCreatedUserNotification[],
  context: WorkerContext,
  config: Config["cronWorkers"]["petition-notifications"]
) {
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
}

/**
 * iterates over an array of unprocessed COMMENT_CREATED contact notifications,
 * sending an email to the contact with the accumulated comments if the last notification
 * was created more than `config.minutesBeforeNotify` minutes ago
 */
async function processCommentCreatedContactNotification(
  notifications: PetitionContactNotification[],
  context: WorkerContext,
  config: Config["cronWorkers"]["petition-notifications"]
) {
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

  if (unprocessedUserNotifications.length > 0) {
    const groupedUserNotifications = groupBy(
      unprocessedUserNotifications,
      (n) => `${n.petition_id},${n.user_id}`
    );
    for (const group of Object.values(groupedUserNotifications)) {
      await processCommentCreatedUserNotification(group, context, config);
    }
  }

  if (unprocessedContactNotifications.length > 0) {
    const groupedContactNotifications = groupBy(
      unprocessedContactNotifications,
      (n) => `${n.petition_id},${n.petition_access_id}`
    );
    for (const group of Object.values(groupedContactNotifications)) {
      await processCommentCreatedContactNotification(group, context, config);
    }
  }
});
