import { differenceInMinutes } from "date-fns";
import { difference, groupBy, maxBy } from "remeda";
import { Config } from "../config";
import { WorkerContext } from "../context";
import { SignatureCancelledUserNotification } from "../db/notifications";
import { PetitionContactNotification, PetitionUserNotification } from "../db/__types";
import { createCronWorker } from "./helpers/createCronWorker";

function shouldBeProcessed(
  notifications: (PetitionUserNotification | PetitionContactNotification)[],
  minutesBeforeNotify: number
) {
  const lastNotification = maxBy(notifications, (n) => n.created_at.getTime())!;
  return differenceInMinutes(new Date(), lastNotification.created_at) > minutesBeforeNotify;
}

/**
 * iterates over an array of unprocessed COMMENT_CREATED user notifications,
 * sending an email to the user with the accumulated comments if the last notification
 * was created more than `config.minutesBeforeNotify` minutes ago
 */
async function processCommentCreatedUserNotifications(
  context: WorkerContext,
  config: Config["cronWorkers"]["petition-notifications"]
) {
  const notifications = await context.petitions.loadUnprocessedUserNotificationsOfType(
    "COMMENT_CREATED"
  );

  if (notifications.length > 0) {
    const groupedUserNotifications = groupBy(notifications, (n) => `${n.petition_id},${n.user_id}`);
    for (const group of Object.values(groupedUserNotifications)) {
      if (shouldBeProcessed(group, config.minutesBeforeNotify)) {
        const petitionId = group[0].petition_id;
        const userId = group[0].user_id;
        const isSubscribed = await context.petitions.isUserSubscribedToPetition(userId, petitionId);
        await context.emails.sendPetitionCommentsUserNotificationEmail(
          petitionId,
          userId,
          group
            .filter((n) => isSubscribed || !!n.data.is_mentioned)
            .map((n) => n.data.petition_field_comment_id)
        );

        await context.petitions.updatePetitionUserNotificationsProcessedAt(group.map((n) => n.id));
      }
    }
  }
}

/**
 * iterates over an array of unprocessed COMMENT_CREATED contact notifications,
 * sending an email to the contact with the accumulated comments if the last notification
 * was created more than `config.minutesBeforeNotify` minutes ago
 */
async function processCommentCreatedContactNotifications(
  context: WorkerContext,
  config: Config["cronWorkers"]["petition-notifications"]
) {
  const notifications = await context.petitions.loadUnprocessedContactNotificationsOfType(
    "COMMENT_CREATED"
  );

  if (notifications.length > 0) {
    const groupedContactNotifications = groupBy(
      notifications,
      (n) => `${n.petition_id},${n.petition_access_id}`
    );
    for (const group of Object.values(groupedContactNotifications)) {
      if (shouldBeProcessed(group, config.minutesBeforeNotify)) {
        const petitionId = group[0].petition_id;
        const accessId = group[0].petition_access_id;

        await context.emails.sendPetitionCommentsContactNotificationEmail(
          petitionId,
          accessId,
          group.map((n) => n.data.petition_field_comment_id)
        );

        await context.petitions.updatePetitionContactNotificationsProcessedAt(
          group.map((n) => n.id)
        );
      }
    }
  }
}

/**
 * reads SIGNATURE_CANCELLED notifications from table `petition_user_notification` and process those depending on the reason of the cancellation:
 *    - EMAIL_BOUNCED, INSUFFICIENT_SIGNATURE_CREDITS and DECLINED_BY_SIGNER: will instantly send email to subscribed users.
 * The rest of reasons will be marked as processed and no action will be taken.
 */
async function processSignatureCancelledUserNotifications(context: WorkerContext) {
  const notifications = await context.petitions.loadUnprocessedUserNotificationsOfType(
    "SIGNATURE_CANCELLED"
  );

  const emailBouncedNotificationIds = await processSignatureCancelledEmailBouncedUserNotifications(
    notifications,
    context
  );

  const noCreditsLeftNotificationIds =
    await processSignatureCancelledNoCreditsLeftUserNotifications(notifications, context);

  const declinedBySignerNotificationIds =
    await processSignatureCancelledDeclinedBySignerUserNotifications(notifications, context);

  const otherIds = difference(
    notifications.map((n) => n.id),
    [
      ...emailBouncedNotificationIds,
      ...noCreditsLeftNotificationIds,
      ...declinedBySignerNotificationIds,
    ]
  );
  if (otherIds.length > 0) {
    await context.petitions.updatePetitionUserNotificationsProcessedAt(otherIds);
  }
}

async function processSignatureCancelledEmailBouncedUserNotifications(
  notifications: SignatureCancelledUserNotification[],
  context: WorkerContext
) {
  const emailBouncedNotifications = notifications.filter(
    (n) =>
      n.data.cancel_reason === "REQUEST_ERROR" && n.data.cancel_data.error_code === "EMAIL_BOUNCED"
  );
  const groupedEmailBouncedNotifications = groupBy(
    emailBouncedNotifications,
    (n) => n.data.petition_signature_request_id
  );
  for (const group of Object.values(groupedEmailBouncedNotifications)) {
    await context.emails.sendSignatureCancelledRequestErrorEmail(
      group[0].data.petition_signature_request_id
    );
    await context.petitions.updatePetitionUserNotificationsProcessedAt(group.map((n) => n.id));
  }

  return emailBouncedNotifications.map((n) => n.id);
}

async function processSignatureCancelledNoCreditsLeftUserNotifications(
  notifications: SignatureCancelledUserNotification[],
  context: WorkerContext
) {
  const noCreditsLeftNotifications = notifications.filter(
    (n) =>
      n.data.cancel_reason === "REQUEST_ERROR" &&
      n.data.cancel_data.error_code === "INSUFFICIENT_SIGNATURE_CREDITS"
  );
  const groupedNoCreditsLeftNotifications = groupBy(
    noCreditsLeftNotifications,
    (n) => n.data.petition_signature_request_id
  );
  for (const group of Object.values(groupedNoCreditsLeftNotifications)) {
    await context.emails.sendSignatureCancelledNoCreditsLeftEmail(
      group[0].data.petition_signature_request_id
    );
    await context.petitions.updatePetitionUserNotificationsProcessedAt(group.map((n) => n.id));
  }

  return noCreditsLeftNotifications.map((n) => n.id);
}

async function processSignatureCancelledDeclinedBySignerUserNotifications(
  notifications: SignatureCancelledUserNotification[],
  context: WorkerContext
) {
  const declinedBySignerNotifications = notifications.filter(
    (n) => n.data.cancel_reason === "DECLINED_BY_SIGNER"
  );
  const groupedDeclinedBySignerNotifications = groupBy(
    declinedBySignerNotifications,
    (n) => n.data.petition_signature_request_id
  );
  for (const group of Object.values(groupedDeclinedBySignerNotifications)) {
    await context.emails.sendSignatureCancelledDeclinedBySignerEmail(
      group[0].data.petition_signature_request_id
    );
    await context.petitions.updatePetitionUserNotificationsProcessedAt(group.map((n) => n.id));
  }

  return declinedBySignerNotifications.map((n) => n.id);
}

createCronWorker("petition-notifications", async (context, config) => {
  await processCommentCreatedUserNotifications(context, config);
  await processCommentCreatedContactNotifications(context, config);
  await processSignatureCancelledUserNotifications(context);
});
