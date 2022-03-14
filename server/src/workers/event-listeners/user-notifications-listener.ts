import { isDefined } from "remeda";
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
} from "../../db/events";
import { EventListener } from "../event-processor";

async function createPetitionCompletedUserNotifications(
  event: PetitionCompletedEvent,
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  let users = await ctx.petitions.loadUsersOnPetition(event.petition_id);
  // if a user completed it, avoid creating a notification for that user
  if (isDefined(event.data.user_id)) {
    users = users.filter((u) => u.id !== event.data.user_id!);
  }
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "PETITION_COMPLETED",
      data: isDefined(event.data.petition_access_id)
        ? { petition_access_id: event.data.petition_access_id }
        : { user_id: event.data.user_id! },
      petition_id: event.petition_id,
      user_id: user.id,
    }))
  );
}

async function createCommentPublishedUserNotifications(
  event: CommentPublishedEvent,
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const comment = await ctx.petitions.loadPetitionFieldComment(
    event.data.petition_field_comment_id
  );

  if (!comment) {
    // if the comment is already deleted, avoid sending notification
    return;
  }

  // Create contact and user notifications
  const [accesses, users] = await Promise.all([
    comment.is_internal ? [] : ctx.petitions.loadAccessesForPetition(event.petition_id),
    ctx.petitions.loadUsersOnPetition(event.petition_id),
  ]);

  const accessIds = accesses
    .filter((a) => a.status === "ACTIVE" && a.id !== comment.petition_access_id)
    .map((a) => a.id);
  const userIds = users.filter((u) => u.id !== comment.user_id).map((u) => u.id);

  await Promise.all([
    ctx.petitions.createPetitionUserNotification(
      userIds.map((userId) => ({
        type: "COMMENT_CREATED",
        petition_id: comment.petition_id,
        user_id: userId,
        data: {
          petition_field_id: comment.petition_field_id,
          petition_field_comment_id: comment.id,
        },
      }))
    ),
    ctx.petitions.createPetitionContactNotification(
      accessIds.map((id) => ({
        type: "COMMENT_CREATED",
        petition_id: comment.petition_id,
        petition_access_id: id,
        data: {
          petition_field_id: comment.petition_field_id,
          petition_field_comment_id: comment.id,
        },
      }))
    ),
  ]);
}

async function createPetitionMessageBouncedUserNotifications(
  event: PetitionMessageBouncedEvent,
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const message = await ctx.petitions.loadMessage(event.data.petition_message_id);
  if (!message) {
    throw new Error(`PetitionMessage:${event.data.petition_message_id} not found.`);
  }
  const sender = await ctx.users.loadUser(message.sender_id);
  if (!sender) {
    throw new Error(`User:${message.sender_id} not found.`);
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
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const reminder = await ctx.petitions.loadReminder(event.data.petition_reminder_id);
  if (!reminder) {
    throw new Error(`PetitionReminder:${event.data.petition_reminder_id} not found.`);
  }

  const senderId =
    reminder.sender_id ??
    (await ctx.petitions.loadAccess(reminder.petition_access_id))?.granter_id ??
    null;

  if (!senderId) {
    throw new Error(`Petition owner not found on Reminder:${reminder.id}.`);
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
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.loadUsersOnPetition(event.petition_id);
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "SIGNATURE_COMPLETED",
      petition_id: event.petition_id,
      user_id: user.id,
      data: {
        petition_signature_request_id: event.data.petition_signature_request_id,
      },
    }))
  );
}

async function createSignatureCancelledUserNotifications(
  event: SignatureCancelledEvent,
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  let users = await ctx.petitions.loadUsersOnPetition(petition.id);
  if (event.data.cancel_reason === "CANCELLED_BY_USER") {
    // if a user cancelled the signature, avoid creating a notification for that user
    users = users.filter(({ id }) => id !== event.data.cancel_data.user_id!);
  }

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
    }))
  );
}

async function createPetitionSharedUserNotifications(
  event: UserPermissionAddedEvent | GroupPermissionAddedEvent,
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  if (event.type === "USER_PERMISSION_ADDED") {
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
    const members = (await ctx.userGroups.loadUserGroupMembers(event.data.user_group_id))
      // avoid sending notification to the user that shared the petition if he is a member of the group
      .filter((m) => m.user_id !== event.data.user_id);
    await ctx.petitions.createPetitionUserNotification(
      members.map((m) => ({
        type: "PETITION_SHARED",
        petition_id: event.petition_id,
        user_id: m.user_id,
        data: {
          owner_id: event.data.user_id,
          user_group_id: event.data.user_group_id,
          permission_type: event.data.permission_type as "READ" | "WRITE",
        },
      }))
    );
  }
}

async function createRemindersOptOutNotifications(event: RemindersOptOutEvent, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.loadUsersOnPetition(event.petition_id);
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
    }))
  );
}

async function createAccessActivatedFromPublicPetitionLinkUserNotifications(
  event: AccessActivatedFromPublicPetitionLinkEvent,
  ctx: WorkerContext
) {
  const petition = await ctx.petitions.loadPetition(event.petition_id);
  if (!petition) return;

  const users = await ctx.petitions.loadUsersOnPetition(event.petition_id);
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK",
      petition_id: event.petition_id,
      user_id: user.id,
      data: {
        petition_access_id: event.data.petition_access_id,
      },
    }))
  );
}

export const userNotificationsListener: EventListener = async (event, ctx) => {
  switch (event.type) {
    case "PETITION_COMPLETED":
      await createPetitionCompletedUserNotifications(event, ctx);
      break;
    case "COMMENT_PUBLISHED":
      await createCommentPublishedUserNotifications(event, ctx);
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
};
