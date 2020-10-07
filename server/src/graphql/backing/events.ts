import {
  PetitionEventType,
  PetitionUserPermissionType,
} from "../../db/__types";
export type PetitionEventPayload<TType extends PetitionEventType> = {
  PETITION_CREATED: { user_id: number };
  PETITION_COMPLETED: { petition_access_id: number };
  ACCESS_ACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_DEACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_OPENED: { petition_access_id: number };
  MESSAGE_SCHEDULED: { petition_message_id: number };
  MESSAGE_CANCELLED: { petition_message_id: number; user_id: number };
  MESSAGE_SENT: { petition_message_id: number };
  REMINDER_SENT: { petition_reminder_id: number };
  REPLY_CREATED: {
    petition_access_id: number;
    petition_field_id: number;
    petition_field_reply_id: number;
  };
  REPLY_DELETED: {
    petition_access_id: number;
    petition_field_id: number;
    petition_field_reply_id: number;
  };
  COMMENT_PUBLISHED: {
    petition_field_id: number;
    petition_field_comment_id: number;
  };
  COMMENT_DELETED: {
    petition_field_id: number;
    user_id?: number;
    petition_access_id?: number;
    petition_field_comment_id: number;
  };
  USER_PERMISSION_ADDED: {
    user_id: number;
    permission_user_id: number;
    permission_type: PetitionUserPermissionType;
  };
  USER_PERMISSION_REMOVED: {
    user_id: number;
    permission_user_id: number;
  };
  USER_PERMISSION_EDITED: {
    user_id: number;
    permission_user_id: number;
    permission_type: PetitionUserPermissionType;
  };
  OWNERSHIP_TRANSFERRED: {
    user_id: number;
    owner_id: number;
  };
  PETITION_REVIEWED: {
    user_id: number;
  };
}[TType];

type GenericPetitionEvent<TType extends PetitionEventType> = {
  id: number;
  type: TType;
  data: PetitionEventPayload<TType>;
  created_at: Date;
};

export type PetitionCreatedEvent = GenericPetitionEvent<"PETITION_CREATED">;
export type PetitionCompletedEvent = GenericPetitionEvent<"PETITION_COMPLETED">;
export type AccessActivatedEvent = GenericPetitionEvent<"ACCESS_ACTIVATED">;
export type AccessDeactivatedEvent = GenericPetitionEvent<"ACCESS_DEACTIVATED">;
export type AccessOpenedEvent = GenericPetitionEvent<"ACCESS_OPENED">;
export type MessageScheduledEvent = GenericPetitionEvent<"MESSAGE_SCHEDULED">;
export type MessageCancelledEvent = GenericPetitionEvent<"MESSAGE_CANCELLED">;
export type MessageSentEvent = GenericPetitionEvent<"MESSAGE_SENT">;
export type ReminderSentEvent = GenericPetitionEvent<"REMINDER_SENT">;
export type ReplyCreatedEvent = GenericPetitionEvent<"REPLY_CREATED">;
export type ReplyDeletedEvent = GenericPetitionEvent<"REPLY_DELETED">;
export type CommentPublishedEvent = GenericPetitionEvent<"COMMENT_PUBLISHED">;
export type CommentDeletedEvent = GenericPetitionEvent<"COMMENT_DELETED">;
export type UserPermissionAddedEvent = GenericPetitionEvent<
  "USER_PERMISSION_ADDED"
>;
export type UserPermissionRemovedEvent = GenericPetitionEvent<
  "USER_PERMISSION_REMOVED"
>;
export type UserPermissionEditedEvent = GenericPetitionEvent<
  "USER_PERMISSION_EDITED"
>;
export type OwnershipTransferredEvent = GenericPetitionEvent<
  "OWNERSHIP_TRANSFERRED"
>;
export type PetitionReviewedEvent = GenericPetitionEvent<"PETITION_REVIEWED">;

export type PetitionEvent =
  | PetitionCreatedEvent
  | PetitionCompletedEvent
  | AccessActivatedEvent
  | AccessDeactivatedEvent
  | AccessOpenedEvent
  | MessageScheduledEvent
  | MessageCancelledEvent
  | MessageSentEvent
  | ReminderSentEvent
  | ReplyCreatedEvent
  | ReplyDeletedEvent
  | CommentPublishedEvent
  | CommentDeletedEvent
  | UserPermissionAddedEvent
  | UserPermissionRemovedEvent
  | UserPermissionEditedEvent
  | OwnershipTransferredEvent
  | PetitionReviewedEvent;
