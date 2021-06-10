import {
  PetitionEvent as DbPetitionEvent,
  PetitionEventType,
  PetitionPermissionType,
  PetitionSignatureCancelReason,
  PetitionStatus,
} from "./__types";

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
    petition_access_id?: number;
    user_id?: number;
    petition_field_id: number;
    petition_field_reply_id: number;
  };
  REPLY_UPDATED: {
    petition_access_id?: number;
    user_id?: number;
    petition_field_id: number;
    petition_field_reply_id: number;
  };
  REPLY_DELETED: {
    petition_access_id?: number;
    user_id?: number;
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
    permission_type: PetitionPermissionType;
  };
  USER_PERMISSION_REMOVED: {
    user_id: number;
    permission_user_id: number;
  };
  USER_PERMISSION_EDITED: {
    user_id: number;
    permission_user_id: number;
    permission_type: PetitionPermissionType;
  };
  GROUP_PERMISSION_ADDED: {
    user_id: number;
    user_group_id: number;
    permission_type: PetitionPermissionType;
  };
  GROUP_PERMISSION_REMOVED: {
    user_id: number;
    user_group_id: number;
  };
  GROUP_PERMISSION_EDITED: {
    user_id: number;
    user_group_id: number;
    permission_type: PetitionPermissionType;
  };
  OWNERSHIP_TRANSFERRED: {
    user_id: number;
    owner_id: number;
    previous_owner_id?: number; // optional for retrocompatibility.
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
  TEMPLATE_USED: {
    template_id: number;
    org_id: number;
    user_id: number;
  };
  PETITION_CLONED: {
    from_petition_id: number;
    org_id: number;
    petition_id: number;
    user_id: number;
    type: "PETITION" | "TEMPLATE";
  };
  PETITION_DELETED: {
    user_id: number;
    status: PetitionStatus;
  };
  PETITION_SENT: {
    user_id: number;
    petition_access_ids: number[];
  };
}[TType];

type GenericPetitionEvent<
  TType extends PetitionEventType,
  IsCreate extends boolean = false
> = Omit<
  DbPetitionEvent,
  "type" | "data" | (IsCreate extends true ? "id" | "created_at" : never)
> & {
  type: TType;
  data: PetitionEventPayload<TType>;
};

export type PetitionCreatedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_CREATED", IsCreate>;
export type PetitionCompletedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_COMPLETED", IsCreate>;
export type AccessActivatedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"ACCESS_ACTIVATED", IsCreate>;
export type AccessDeactivatedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"ACCESS_DEACTIVATED", IsCreate>;
export type AccessOpenedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"ACCESS_OPENED", IsCreate>;
export type AccessDelegatedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"ACCESS_DELEGATED", IsCreate>;
export type MessageScheduledEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"MESSAGE_SCHEDULED", IsCreate>;
export type MessageCancelledEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"MESSAGE_CANCELLED", IsCreate>;
export type MessageSentEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"MESSAGE_SENT", IsCreate>;
export type ReminderSentEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"REMINDER_SENT", IsCreate>;
export type ReplyCreatedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"REPLY_CREATED", IsCreate>;
export type ReplyUpdatedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"REPLY_UPDATED", IsCreate>;
export type ReplyDeletedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"REPLY_DELETED", IsCreate>;
export type CommentPublishedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"COMMENT_PUBLISHED", IsCreate>;
export type CommentDeletedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"COMMENT_DELETED", IsCreate>;
export type UserPermissionAddedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"USER_PERMISSION_ADDED", IsCreate>;
export type UserPermissionRemovedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"USER_PERMISSION_REMOVED", IsCreate>;
export type UserPermissionEditedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"USER_PERMISSION_EDITED", IsCreate>;
export type GroupPermissionAddedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"GROUP_PERMISSION_ADDED", IsCreate>;
export type GroupPermissionEditedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"GROUP_PERMISSION_EDITED", IsCreate>;
export type GroupPermissionRemovedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"GROUP_PERMISSION_REMOVED", IsCreate>;

export type OwnershipTransferredEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"OWNERSHIP_TRANSFERRED", IsCreate>;
export type PetitionClosedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_CLOSED", IsCreate>;
export type PetitionClosedNotifiedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_CLOSED_NOTIFIED", IsCreate>;
export type PetitionReopenedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_REOPENED", IsCreate>;

export type SignatureStartedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"SIGNATURE_STARTED", IsCreate>;
export type SignatureCompletedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"SIGNATURE_COMPLETED", IsCreate>;
export type SignatureCancelledEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"SIGNATURE_CANCELLED", IsCreate>;
export type TemplateUsedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"TEMPLATE_USED", IsCreate>;
export type PetitionClonedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_CLONED", IsCreate>;
export type PetitionDeletedEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_DELETED", IsCreate>;
export type PetitionSentEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"PETITION_SENT", IsCreate>;

export type PetitionEvent<IsCreate extends boolean = false> =
  | PetitionCreatedEvent<IsCreate>
  | PetitionCompletedEvent<IsCreate>
  | AccessActivatedEvent<IsCreate>
  | AccessDeactivatedEvent<IsCreate>
  | AccessOpenedEvent<IsCreate>
  | AccessDelegatedEvent<IsCreate>
  | MessageScheduledEvent<IsCreate>
  | MessageCancelledEvent<IsCreate>
  | MessageSentEvent<IsCreate>
  | ReminderSentEvent<IsCreate>
  | ReplyCreatedEvent<IsCreate>
  | ReplyUpdatedEvent<IsCreate>
  | ReplyDeletedEvent<IsCreate>
  | CommentPublishedEvent<IsCreate>
  | CommentDeletedEvent<IsCreate>
  | UserPermissionAddedEvent<IsCreate>
  | UserPermissionRemovedEvent<IsCreate>
  | UserPermissionEditedEvent<IsCreate>
  | GroupPermissionAddedEvent<IsCreate>
  | GroupPermissionEditedEvent<IsCreate>
  | GroupPermissionRemovedEvent<IsCreate>
  | OwnershipTransferredEvent<IsCreate>
  | PetitionClosedEvent<IsCreate>
  | PetitionClosedNotifiedEvent<IsCreate>
  | PetitionReopenedEvent<IsCreate>
  | SignatureStartedEvent<IsCreate>
  | SignatureCompletedEvent<IsCreate>
  | SignatureCancelledEvent<IsCreate>
  | TemplateUsedEvent<IsCreate>
  | PetitionClonedEvent<IsCreate>
  | PetitionDeletedEvent<IsCreate>
  | PetitionSentEvent<IsCreate>;

export type CreatePetitionEvent = PetitionEvent<true>;

/** SYSTEM EVENTS */
export type SystemEventType = "USER_LOGGED_IN" | "USER_CREATED";

export type SystemEventPayload<TType extends SystemEventType> = {
  USER_LOGGED_IN: {
    user_id: number;
  };
  USER_CREATED: {
    user_id: number;
  };
}[TType];

type GenericSystemEvent<TType extends SystemEventType> = {
  type: TType;
  data: SystemEventPayload<TType>;
};

export type UserCreatedEvent = GenericSystemEvent<"USER_CREATED">;
export type UserLoggedInEvent = GenericSystemEvent<"USER_LOGGED_IN">;

export type SystemEvent = UserLoggedInEvent | UserCreatedEvent;
