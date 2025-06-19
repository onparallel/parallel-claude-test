import { inject, injectable } from "inversify";
import { isNonNullish, isNullish, partition, unique } from "remeda";
import { assert } from "ts-essentials";
import { PetitionEventType } from "../../../db/__types";
import {
  AccessActivatedFromPublicPetitionLinkEvent,
  CommentPublishedEvent,
  GroupPermissionAddedEvent,
  PetitionCompletedEvent,
  PetitionEvent,
  PetitionMessageBouncedEvent,
  PetitionReminderBouncedEvent,
  RemindersOptOutEvent,
  SignatureCancelledEvent,
  SignatureCompletedEvent,
  UserPermissionAddedEvent,
} from "../../../db/events/PetitionEvent";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserGroupRepository } from "../../../db/repositories/UserGroupRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { collectMentionsFromSlate } from "../../../util/slate/mentions";
import { EventListener } from "../EventProcessorQueue";

export const USER_NOTIFICATIONS_LISTENER = Symbol.for("USER_NOTIFICATIONS_LISTENER");

@injectable()
export class UserNotificationsListener implements EventListener<PetitionEventType> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserGroupRepository) private userGroups: UserGroupRepository,
    @inject(UserRepository) private users: UserRepository,
  ) {}

  public types = [
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
  ] as PetitionEventType[];

  public async handle(event: PetitionEvent) {
    switch (event.type) {
      case "PETITION_COMPLETED":
        await this.createPetitionCompletedUserNotifications(event);
        break;
      case "COMMENT_PUBLISHED":
        await this.createCommentPublishedUserNotifications(event);
        await this.createCommentPublishedContactNotifications(event);
        break;
      case "PETITION_MESSAGE_BOUNCED":
        await this.createPetitionMessageBouncedUserNotifications(event);
        break;
      case "PETITION_REMINDER_BOUNCED":
        await this.createPetitionReminderBouncedUserNotifications(event);
        break;
      case "SIGNATURE_COMPLETED":
        await this.createSignatureCompletedUserNotifications(event);
        break;
      case "SIGNATURE_CANCELLED":
        await this.createSignatureCancelledUserNotifications(event);
        break;
      case "USER_PERMISSION_ADDED":
      case "GROUP_PERMISSION_ADDED":
        await this.createPetitionSharedUserNotifications(event);
        break;
      case "REMINDERS_OPT_OUT":
        await this.createRemindersOptOutNotifications(event);
        break;
      case "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK":
        await this.createAccessActivatedFromPublicPetitionLinkUserNotifications(event);
        break;
      default:
        break;
    }
  }

  private async createPetitionCompletedUserNotifications(event: PetitionCompletedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const users = (await this.petitions.loadUsersOnPetition(event.petition_id)).filter(
      (u) =>
        u.is_subscribed &&
        // if a user completed it, avoid creating a notification for that user
        u.id !== event.data.user_id,
    );

    await this.petitions.createPetitionUserNotification(
      users.map((user) => ({
        type: "PETITION_COMPLETED",
        data: isNonNullish(event.data.petition_access_id)
          ? { petition_access_id: event.data.petition_access_id }
          : { user_id: event.data.user_id! },
        petition_id: event.petition_id,
        user_id: user.id,
      })),
    );
  }

  private async createCommentPublishedUserNotifications(event: CommentPublishedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    let comment = await this.petitions.loadPetitionFieldComment(
      event.data.petition_field_comment_id,
    );
    if (isNullish(comment)) {
      // if the comment is already deleted, avoid sending notification
      return;
    }

    const mentions = collectMentionsFromSlate(comment.content_json);
    const [userMentions, groupMentions] = partition(mentions, (m) => m.type === "User");
    const groupMembers = await this.userGroups.loadUserGroupMembers(groupMentions.map((m) => m.id));

    const mentionedUserIds = unique([
      ...userMentions.map((m) => m.id),
      ...groupMembers.flatMap((members) => members.map((m) => m.user_id)),
    ]);

    const users = (await this.petitions.loadUsersOnPetition(event.petition_id)).filter(
      (u) => u.id !== comment!.user_id,
    );

    const userIds = users.map((u) => u.id);
    const subscribedUserIds = users.filter((u) => u.is_subscribed).map((u) => u.id);

    const userIdsToNotify = userIds.filter(
      (userId) => subscribedUserIds.includes(userId) || mentionedUserIds.includes(userId),
    );

    // make sure comment was not deleted in the meantime
    comment = await this.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
      refresh: true,
    });
    if (isNullish(comment)) {
      return;
    }

    await this.petitions.createPetitionUserNotification(
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
    comment = await this.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
      refresh: true,
    });
    if (isNullish(comment)) {
      await this.petitions.deleteCommentCreatedNotifications(event.petition_id, [
        event.data.petition_field_comment_id,
      ]);
    }
  }

  private async createCommentPublishedContactNotifications(event: CommentPublishedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    let comment = await this.petitions.loadPetitionFieldComment(
      event.data.petition_field_comment_id,
    );
    if (isNullish(comment)) {
      // if the comment is already deleted, avoid sending notification
      return;
    }

    // Create contact and user notifications
    const accesses = comment.is_internal
      ? []
      : await this.petitions.loadAccessesForPetition(event.petition_id);

    const accessIds = accesses
      .filter(
        (a) =>
          a.status === "ACTIVE" && // active access
          a.id !== comment!.petition_access_id && // don't notify comment author
          isNonNullish(a.contact_id), // filter contactless
      )
      .map((a) => a.id);

    // make sure comment was not deleted in the meantime
    comment = await this.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
      refresh: true,
    });
    if (isNullish(comment)) {
      return;
    }

    await this.petitions.createPetitionContactNotification(
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
    comment = await this.petitions.loadPetitionFieldComment(event.data.petition_field_comment_id, {
      refresh: true,
    });
    if (isNullish(comment)) {
      await this.petitions.deleteCommentCreatedNotifications(event.petition_id, [
        event.data.petition_field_comment_id,
      ]);
    }
  }

  private async createPetitionMessageBouncedUserNotifications(event: PetitionMessageBouncedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const message = await this.petitions.loadMessage(event.data.petition_message_id);
    assert(isNonNullish(message), `PetitionMessage:${event.data.petition_message_id} not found.`);

    const sender = await this.users.loadUser(message.sender_id);
    assert(isNonNullish(sender), `User:${message.sender_id} not found.`);

    if (!(await this.petitions.isUserSubscribedToPetition(sender.id, event.petition_id))) {
      return;
    }

    await this.petitions.createPetitionUserNotification([
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

  private async createPetitionReminderBouncedUserNotifications(
    event: PetitionReminderBouncedEvent,
  ) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const reminder = await this.petitions.loadReminder(event.data.petition_reminder_id);
    assert(
      isNonNullish(reminder),
      `PetitionReminder:${event.data.petition_reminder_id} not found.`,
    );

    const senderId =
      reminder.sender_id ??
      (await this.petitions.loadAccess(reminder.petition_access_id))?.granter_id ??
      null;
    assert(isNonNullish(senderId), `Petition owner not found on Reminder:${reminder.id}.`);

    if (!(await this.petitions.isUserSubscribedToPetition(senderId, event.petition_id))) {
      return;
    }

    await this.petitions.createPetitionUserNotification([
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

  private async createSignatureCompletedUserNotifications(event: SignatureCompletedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const users = (await this.petitions.loadUsersOnPetition(event.petition_id)).filter(
      (u) => u.is_subscribed,
    );
    await this.petitions.createPetitionUserNotification(
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

  private async createSignatureCancelledUserNotifications(event: SignatureCancelledEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const users = (await this.petitions.loadUsersOnPetition(petition.id)).filter(
      (u) =>
        u.is_subscribed &&
        // if a user cancelled the signature, avoid creating a notification for that user
        (event.data.cancel_reason !== "CANCELLED_BY_USER" ||
          u.id !== event.data.cancel_data.user_id),
    );

    await this.petitions.createPetitionUserNotification(
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

  private async createPetitionSharedUserNotifications(
    event: UserPermissionAddedEvent | GroupPermissionAddedEvent,
  ) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    if (event.type === "USER_PERMISSION_ADDED") {
      if (
        !(await this.petitions.isUserSubscribedToPetition(
          event.data.permission_user_id,
          event.petition_id,
        ))
      ) {
        return;
      }

      await this.petitions.createPetitionUserNotification([
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
      const groupMembers = await this.userGroups.loadUserGroupMembers(event.data.user_group_id);
      const groupMemberUserIds = groupMembers.map((m) => m.user_id);
      const subscribedUsers = (await this.petitions.loadUsersOnPetition(event.petition_id)).filter(
        (u) =>
          u.is_subscribed &&
          // avoid sending notification to the user that shared the petition if he is a member of the group
          u.id !== event.data.user_id,
      );

      await this.petitions.createPetitionUserNotification(
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

  private async createRemindersOptOutNotifications(event: RemindersOptOutEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const users = (await this.petitions.loadUsersOnPetition(event.petition_id)).filter(
      (u) => u.is_subscribed,
    );
    await this.petitions.createPetitionUserNotification(
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

  private async createAccessActivatedFromPublicPetitionLinkUserNotifications(
    event: AccessActivatedFromPublicPetitionLinkEvent,
  ) {
    const petition = await this.petitions.loadPetition(event.petition_id);
    if (!petition) return;

    const users = (await this.petitions.loadUsersOnPetition(event.petition_id)).filter(
      (u) => u.is_subscribed,
    );
    await this.petitions.createPetitionUserNotification(
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
}
