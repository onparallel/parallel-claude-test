import { addSeconds } from "date-fns";
import { groupBy, sortBy } from "remeda";
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

const WORKER_CONFIG = {
  COMMENT_CREATED: {
    SECONDS_BEFORE_NOTIFY: 15,
  },
};

function processCommentCreatedUserNotification(context: WorkerContext) {
  return async (notifications: PetitionUserNotification[]) => {
    const lastNotification = sortBy(
      notifications,
      (n) => n.created_at
    ).reverse()[0];

    if (
      addSeconds(
        lastNotification.created_at,
        WORKER_CONFIG.COMMENT_CREATED.SECONDS_BEFORE_NOTIFY
      ).getTime() < Date.now()
    ) {
      const userId = lastNotification.user_id;
      const petitionId = lastNotification.petition_id;
      console.log(
        `User ${userId} has ${notifications.length} new comments on petition ${petitionId}`
      );
      await context.petitions.updatePetitionUserNotifications(
        notifications.map((n) => n.id),
        {
          email_notification_sent_at: new Date(),
        }
      );
    }
  };
}

function processCommentCreatedContactNotification(context: WorkerContext) {
  return async (notifications: PetitionContactNotification[]) => {
    const lastNotification = sortBy(
      notifications,
      (n) => n.created_at
    ).reverse()[0];

    if (
      addSeconds(
        lastNotification.created_at,
        WORKER_CONFIG.COMMENT_CREATED.SECONDS_BEFORE_NOTIFY
      ).getTime() < Date.now()
    ) {
      const accessId = lastNotification.petition_access_id;
      const petitionId = lastNotification.petition_id;
      console.log(
        `Access ${accessId} has ${notifications.length} new comments on petition ${petitionId}`
      );

      await context.petitions.updatePetitionContactNotifications(
        notifications.map((n) => n.id),
        {
          email_notification_sent_at: new Date(),
        }
      );
    }
  };
}

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

createCronWorker("petition-notifications", async (context) => {
  await groupNotifications(
    await context.petitions.loadUnprocessedCommentCreatedUserNotifications(),
    processCommentCreatedUserNotification(context)
  );

  await groupNotifications(
    await context.petitions.loadUnprocessedCommentCreatedContactNotifications(),
    processCommentCreatedContactNotification(context)
  );
});
