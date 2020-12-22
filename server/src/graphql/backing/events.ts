import {
  PetitionEventType,
  PetitionSignatureCancelReason,
  PetitionUserPermissionType,
} from "../../db/__types";
export type PetitionEventPayload<TType extends PetitionEventType> = {
  PETITION_CREATED: { user_id: number };
  PETITION_COMPLETED: { petition_access_id: number };
  ACCESS_ACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_DEACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_OPENED: { petition_access_id: number };
  ACCESS_DELEGATED: {
    new_petition_access_id: number; // new petition access created by the contact
    petition_access_id: number; // original access from where the delegation ocurred
  };
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
  PETITION_CLOSED: {
    user_id: number;
  };
  PETITION_CLOSED_NOTIFIED: {
    user_id: number;
    petition_access_id: number;
  };
  PETITION_REOPENED: {
    user_id: number;
  };
  SIGNATURE_STARTED: {
    petition_signature_request_id: number;
  };
  SIGNATURE_CANCELLED: {
    petition_signature_request_id: number;
    cancel_reason: PetitionSignatureCancelReason;
    cancel_data?: {
      canceller_id?: number; // User or Contact
      canceller_reason?: string;
    };
  };
  SIGNATURE_COMPLETED: {
    petition_signature_request_id: number;
    file_upload_id: number;
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
export type AccessDelegatedEvent = GenericPetitionEvent<"ACCESS_DELEGATED">;
export type MessageScheduledEvent = GenericPetitionEvent<"MESSAGE_SCHEDULED">;
export type MessageCancelledEvent = GenericPetitionEvent<"MESSAGE_CANCELLED">;
export type MessageSentEvent = GenericPetitionEvent<"MESSAGE_SENT">;
export type ReminderSentEvent = GenericPetitionEvent<"REMINDER_SENT">;
export type ReplyCreatedEvent = GenericPetitionEvent<"REPLY_CREATED">;
export type ReplyDeletedEvent = GenericPetitionEvent<"REPLY_DELETED">;
export type CommentPublishedEvent = GenericPetitionEvent<"COMMENT_PUBLISHED">;
export type CommentDeletedEvent = GenericPetitionEvent<"COMMENT_DELETED">;
export type UserPermissionAddedEvent = GenericPetitionEvent<"USER_PERMISSION_ADDED">;
export type UserPermissionRemovedEvent = GenericPetitionEvent<"USER_PERMISSION_REMOVED">;
export type UserPermissionEditedEvent = GenericPetitionEvent<"USER_PERMISSION_EDITED">;
export type OwnershipTransferredEvent = GenericPetitionEvent<"OWNERSHIP_TRANSFERRED">;
export type PetitionClosedEvent = GenericPetitionEvent<"PETITION_CLOSED">;
export type PetitionClosedNotifiedEvent = GenericPetitionEvent<"PETITION_CLOSED_NOTIFIED">;
export type PetitionReopenedEvent = GenericPetitionEvent<"PETITION_REOPENED">;

export type SignatureStartedEvent = GenericPetitionEvent<"SIGNATURE_STARTED">;
export type SignatureCompletedEvent = GenericPetitionEvent<"SIGNATURE_COMPLETED">;
export type SignatureCancelledEvent = GenericPetitionEvent<"SIGNATURE_CANCELLED">;

export type PetitionEvent =
  | PetitionCreatedEvent
  | PetitionCompletedEvent
  | AccessActivatedEvent
  | AccessDeactivatedEvent
  | AccessOpenedEvent
  | AccessDelegatedEvent
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
  | PetitionClosedEvent
  | PetitionClosedNotifiedEvent
  | PetitionReopenedEvent
  | SignatureStartedEvent
  | SignatureCompletedEvent
  | SignatureCancelledEvent;
