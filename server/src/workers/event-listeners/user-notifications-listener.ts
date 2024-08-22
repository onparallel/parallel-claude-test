import { isDefined, partition, unique } from "remeda";
import { assert } from "ts-essentials";
import { WorkerContext } from "../../context";
import {
  AccessActivatedFromPublicPetitionLinkEvent,
  CommentPublishedEvent,
  GroupPermissionAddedEvent,
  PetitionCompletedEvent,
  PetitionMessageBouncedEvent,
  PetitionReminderBouncedEvent,
  RemindersOptOutEvent,
  SignatureCancelledEvent,
  SignatureCompletedEvent,
  UserPermissionAddedEvent,
} from "../../db/events/PetitionEvent";
import { collectMentionsFromSlate } from "../../util/slate/mentions";
import { listener } from "../helpers/EventProcessor";

async function createPetitionCompletedUserNotifications(
  event: PetitionCompletedEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.getUsersOnPetition(event.petition_id, {
    onlySubscribed: true,
    // if a user completed it, avoid creating a notification for that user
    excludeUserIds: isDefined(event.data.user_id) ? [event.data.user_id] : undefined,
  });

  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "PETITION_COMPLETED",
      data: isDefined(event.data.petition_access_id)
        ? { petition_access_id: event.data.petition_access_id }
        : { user_id: event.data.user_id! },
      petition_id: event.petition_id,
      user_id: user.id,
    })),
  );
}

async function createCommentPublishedUserNotifications(
  event: CommentPublishedEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  let comment = await ctx.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id);
  if (!isDefined(comment)) {
    // if the comment is already deleted, avoid sending notification
    return;
  }

  const mentions = collectMentionsFromSlate(comment.content_json);
  const [userMentions, groupMentions] = partition(mentions, (m) => m.type === "User");
  const groupMembers = await ctx.userGroups.loadUserGroupMembers(groupMentions.map((m) => m.id));

  const mentionedUserIds = unique([
    ...userMentions.map((m) => m.id),
    ...groupMembers.flatMap((members) => members.map((m) => m.user_id)),
  ]);

  const [users, subscribedUsers] = await Promise.all([
    ctx.petitions.getUsersOnPetition(event.petition_id, {
      excludeUserIds: comment!.user_id ? [comment!.user_id] : undefined,
    }),
    ctx.petitions.getUsersOnPetition(event.petition_id, {
      onlySubscribed: true,
      excludeUserIds: comment!.user_id ? [comment!.user_id] : undefined,
    }),
  ]);

  const userIds = users.map((u) => u.id);
  const subscribedUserIds = subscribedUsers.map((u) => u.id);

  const userIdsToNotify = userIds.filter(
    (userId) => subscribedUserIds.includes(userId) || mentionedUserIds.includes(userId),
  );

  // make sure comment was not deleted in the meantime
  comment = await ctx.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
    refresh: true,
  });
  if (!isDefined(comment)) {
    return;
  }

  await ctx.petitions.createPetitionUserNotification(
    userIdsToNotify.map((userId) => ({
      type: "COMMENT_CREATED",
      petition_id: comment!.petition_id,
      user_id: userId,
      data: {
        petition_field_id: comment!.petition_field_id,
        petition_field_comment_id: comment!.id,
        is_mentioned: mentionedUserIds.includes(userId),
      },
    })),
  );

  // there is a chance the comments were deleted right after creating notifications,
  // so we need to check again if the comment still exists
  comment = await ctx.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
    refresh: true,
  });
  if (!isDefined(comment)) {
    await ctx.petitions.deleteCommentCreatedNotifications(event.petition_id, [
      event.data.petition_field_comment_id,
    ]);
  }
}

async function createCommentPublishedContactNotifications(
  event: CommentPublishedEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  let comment = await ctx.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id);
  if (!isDefined(comment)) {
    // if the comment is already deleted, avoid sending notification
    return;
  }

  // Create contact and user notifications
  const accesses = comment.is_internal
    ? []
    : await ctx.petitions.loadAccessesForPetition(event.petition_id);

  const accessIds = accesses
    .filter(
      (a) =>
        a.status === "ACTIVE" && // active access
        a.id !== comment!.petition_access_id && // don't notify comment author
        isDefined(a.contact_id), // filter contactless
    )
    .map((a) => a.id);

  // make sure comment was not deleted in the meantime
  comment = await ctx.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
    refresh: true,
  });
  if (!isDefined(comment)) {
    return;
  }

  await ctx.petitions.createPetitionContactNotification(
    accessIds.map((id) => ({
      type: "COMMENT_CREATED",
      petition_id: comment!.petition_id,
      petition_access_id: id,
      data: {
        petition_field_id: comment!.petition_field_id,
        petition_field_comment_id: comment!.id,
      },
    })),
  );

  // there is a chance the comments were deleted right after creating notifications,
  // so we need to check again if the comment still exists
  comment = await ctx.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
    refresh: true,
  });
  if (!isDefined(comment)) {
    await ctx.petitions.deleteCommentCreatedNotifications(event.petition_id, [
      event.data.petition_field_comment_id,
    ]);
  }
}

async function createPetitionMessageBouncedUserNotifications(
  event: PetitionMessageBouncedEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const message = await ctx.petitions.loadMessage(event.data.petition_message_id);
  assert(isDefined(message), `PetitionMessage:${event.data.petition_message_id} not found.`);

  const sender = await ctx.users.loadUser(message.sender_id);
  assert(isDefined(sender), `User:${message.sender_id} not found.`);

  if (!(await ctx.petitions.isUserSubscribedToPetition(sender.id, event.petition_id))) {
    return;
  }

  await ctx.petitions.createPetitionUserNotification([
    {
      type: "MESSAGE_EMAIL_BOUNCED",
      user_id: sender.id,
      petition_id: event.petition_id,
      data: {
        petition_access_id: message.petition_access_id,
      },
    },
  ]);
}

async function createPetitionReminderBouncedUserNotifications(
  event: PetitionReminderBouncedEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const reminder = await ctx.petitions.loadReminder(event.data.petition_reminder_id);
  assert(isDefined(reminder), `PetitionReminder:${event.data.petition_reminder_id} not found.`);

  const senderId =
    reminder.sender_id ??
    (await ctx.petitions.loadAccess(reminder.petition_access_id))?.granter_id ??
    null;
  assert(isDefined(senderId), `Petition owner not found on Reminder:${reminder.id}.`);

  if (!(await ctx.petitions.isUserSubscribedToPetition(senderId, event.petition_id))) {
    return;
  }

  await ctx.petitions.createPetitionUserNotification([
    {
      type: "REMINDER_EMAIL_BOUNCED",
      user_id: senderId,
      petition_id: event.petition_id,
      data: {
        petition_access_id: reminder.petition_access_id,
      },
    },
  ]);
}

async function createSignatureCompletedUserNotifications(
  event: SignatureCompletedEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.getUsersOnPetition(event.petition_id, { onlySubscribed: true });
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "SIGNATURE_COMPLETED",
      petition_id: event.petition_id,
      user_id: user.id,
      data: {
        petition_signature_request_id: event.data.petition_signature_request_id,
      },
    })),
  );
}

async function createSignatureCancelledUserNotifications(
  event: SignatureCancelledEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.getUsersOnPetition(petition.id, {
    onlySubscribed: true,
    // if a user cancelled the signature, avoid creating a notification for that user
    excludeUserIds:
      event.data.cancel_reason === "CANCELLED_BY_USER"
        ? [event.data.cancel_data.user_id!]
        : undefined,
  });

  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "SIGNATURE_CANCELLED",
      petition_id: event.petition_id,
      user_id: user.id,
      data: {
        cancel_reason: event.data.cancel_reason,
        cancel_data: event.data.cancel_data,
        petition_signature_request_id: event.data.petition_signature_request_id,
      },
    })),
  );
}

async function createPetitionSharedUserNotifications(
  event: UserPermissionAddedEvent | GroupPermissionAddedEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  if (event.type === "USER_PERMISSION_ADDED") {
    if (
      !(await ctx.petitions.isUserSubscribedToPetition(
        event.data.permission_user_id,
        event.petition_id,
      ))
    ) {
      return;
    }

    await ctx.petitions.createPetitionUserNotification([
      {
        type: "PETITION_SHARED",
        petition_id: event.petition_id,
        user_id: event.data.permission_user_id,
        data: {
          owner_id: event.data.user_id,
          permission_type: event.data.permission_type as "READ" | "WRITE",
          user_id: event.data.permission_user_id,
        },
      },
    ]);
  } else if (event.type === "GROUP_PERMISSION_ADDED") {
    const groupMembers = await ctx.userGroups.loadUserGroupMembers(event.data.user_group_id);
    const groupMemberUserIds = groupMembers.map((m) => m.user_id);
    const subscribedUsers = await ctx.petitions.getUsersOnPetition(
      event.petition_id,
      // avoid sending notification to the user that shared the petition if he is a member of the group
      { onlySubscribed: true, excludeUserIds: [event.data.user_id] },
    );

    await ctx.petitions.createPetitionUserNotification(
      subscribedUsers
        // notify only subscribed users that are members of the group
        .filter((user) => groupMemberUserIds.includes(user.id))
        .map((user) => ({
          type: "PETITION_SHARED",
          petition_id: event.petition_id,
          user_id: user.id,
          data: {
            owner_id: event.data.user_id,
            user_group_id: event.data.user_group_id,
            permission_type: event.data.permission_type as "READ" | "WRITE",
          },
        })),
    );
  }
}

async function createRemindersOptOutNotifications(event: RemindersOptOutEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.getUsersOnPetition(event.petition_id, { onlySubscribed: true });
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "REMINDERS_OPT_OUT",
      petition_id: event.petition_id,
      user_id: user.id,
      data: {
        petition_access_id: event.data.petition_access_id,
        reason: event.data.reason,
        other: event.data.other,
      },
    })),
  );
}

async function createAccessActivatedFromPublicPetitionLinkUserNotifications(
  event: AccessActivatedFromPublicPetitionLinkEvent,
  ctx: WorkerContext,
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.getUsersOnPetition(event.petition_id, { onlySubscribed: true });
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
      petition_id: event.petition_id,
      user_id: user.id,
      data: {
        petition_access_id: event.data.petition_access_id,
      },
    })),
  );
}

export const userNotificationsListener = listener(
  [
    "PETITION_COMPLETED",
    "COMMENT_PUBLISHED",
    "PETITION_MESSAGE_BOUNCED",
    "PETITION_REMINDER_BOUNCED",
    "SIGNATURE_COMPLETED",
    "SIGNATURE_CANCELLED",
    "USER_PERMISSION_ADDED",
    "GROUP_PERMISSION_ADDED",
    "REMINDERS_OPT_OUT",
    "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
  ],
  async (event, ctx) => {
    switch (event.type) {
      case "PETITION_COMPLETED":
        await createPetitionCompletedUserNotifications(event, ctx);
        break;
      case "COMMENT_PUBLISHED":
        await createCommentPublishedUserNotifications(event, ctx);
        await createCommentPublishedContactNotifications(event, ctx);
        break;
      case "PETITION_MESSAGE_BOUNCED":
        await createPetitionMessageBouncedUserNotifications(event, ctx);
        break;
      case "PETITION_REMINDER_BOUNCED":
        await createPetitionReminderBouncedUserNotifications(event, ctx);
        break;
      case "SIGNATURE_COMPLETED":
        await createSignatureCompletedUserNotifications(event, ctx);
        break;
      case "SIGNATURE_CANCELLED":
        await createSignatureCancelledUserNotifications(event, ctx);
        break;
      case "USER_PERMISSION_ADDED":
      case "GROUP_PERMISSION_ADDED":
        await createPetitionSharedUserNotifications(event, ctx);
        break;
      case "REMINDERS_OPT_OUT":
        await createRemindersOptOutNotifications(event, ctx);
        break;
      case "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK":
        await createAccessActivatedFromPublicPetitionLinkUserNotifications(event, ctx);
        break;
      default:
        break;
    }
  },
);
