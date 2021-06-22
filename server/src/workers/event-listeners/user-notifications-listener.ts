import { WorkerContext } from "../../context";
import {
  CommentPublishedEvent,
  EmailBouncedEvent,
  GroupPermissionAddedEvent,
  PetitionCompletedEvent,
  SignatureCancelledEvent,
  SignatureCompletedEvent,
  UserPermissionAddedEvent,
} from "../../db/events";
import { EventListener } from "../event-processor";

async function createPetitionCompletedUserNotifications(
  event: PetitionCompletedEvent,
  ctx: WorkerContext
) {
  const users = await ctx.petitions.loadUsersOnPetition(event.petition_id);
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "PETITION_COMPLETED",
      data: { petition_access_id: event.data.petition_access_id },
      petition_id: event.petition_id,
      user_id: user.id,
      is_read: false,
      processed_at: null,
    }))
  );
}

async function createCommentPublishedUserNotifications(
  event: CommentPublishedEvent,
  ctx: WorkerContext
) {
  const comment = await ctx.petitions.loadPetitionFieldComment(
    event.data.petition_field_comment_id
  );

  if (!comment) {
    // if the comment is already deleted, avoid sending notification
    return;
  }

  // Create contact and user notifications
  const [accesses, users] = await Promise.all([
    comment.is_internal
      ? []
      : ctx.petitions.loadAccessesForPetition(event.petition_id),
    ctx.petitions.loadUsersOnPetition(event.petition_id),
  ]);

  const accessIds = accesses
    .filter((a) => a.status === "ACTIVE" && a.id !== comment.petition_access_id)
    .map((a) => a.id);
  const userIds = users
    .filter((u) => u.id !== comment.user_id)
    .map((u) => u.id);

  await Promise.all([
    ctx.petitions.createPetitionUserNotification(
      userIds.map((userId) => ({
        type: "COMMENT_CREATED",
        petition_id: comment.petition_id,
        user_id: userId,
        is_read: false,
        processed_at: null,
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

async function createEmailBouncedUserNotifications(
  event: EmailBouncedEvent,
  ctx: WorkerContext
) {
  const message = await ctx.petitions.loadMessageByEmailLogId(
    event.data.email_log_id
  );
  if (!message) {
    throw new Error(
      `PetitionMessage for EmailLog:${event.data.email_log_id} not found.`
    );
  }
  const sender = await ctx.users.loadUser(message.sender_id);
  if (!sender) {
    throw new Error(`User:${message.sender_id} not found.`);
  }
  await ctx.petitions.createPetitionUserNotification([
    {
      type: "MESSAGE_EMAIL_BOUNCED",
      is_read: false,
      processed_at: null,
      user_id: sender.id,
      petition_id: message.petition_id,
      data: {
        petition_access_id: message.petition_access_id,
      },
    },
  ]);
}

async function createSignatureCompletedUserNotifications(
  event: SignatureCompletedEvent,
  ctx: WorkerContext
) {
  const users = await ctx.petitions.loadUsersOnPetition(event.petition_id);
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "SIGNATURE_COMPLETED",
      is_read: false,
      processed_at: null,
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
  const users = await ctx.petitions.loadUsersOnPetition(event.petition_id);
  await ctx.petitions.createPetitionUserNotification(
    users.map((user) => ({
      type: "SIGNATURE_CANCELLED",
      is_read: false,
      processed_at: null,
      petition_id: event.petition_id,
      user_id: user.id,
      data: {
        petition_signature_request_id: event.data.petition_signature_request_id,
      },
    }))
  );
}

async function createPetitionSharedUserNotifications(
  event: UserPermissionAddedEvent | GroupPermissionAddedEvent,
  ctx: WorkerContext
) {
  if (event.type === "USER_PERMISSION_ADDED") {
    await ctx.petitions.createPetitionUserNotification([
      {
        type: "PETITION_SHARED",
        is_read: false,
        processed_at: null,
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
    const members = await ctx.userGroups.loadUserGroupMembers(
      event.data.user_group_id
    );
    await ctx.petitions.createPetitionUserNotification(
      members.map((m) => ({
        type: "PETITION_SHARED",
        is_read: false,
        processed_at: null,
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

export const userNotificationsListener: EventListener = async (event, ctx) => {
  switch (event.type) {
    case "PETITION_COMPLETED":
      await createPetitionCompletedUserNotifications(event, ctx);
      break;
    case "COMMENT_PUBLISHED":
      await createCommentPublishedUserNotifications(event, ctx);
      break;
    case "EMAIL_BOUNCED":
      await createEmailBouncedUserNotifications(event, ctx);
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
    default:
      break;
  }
};
