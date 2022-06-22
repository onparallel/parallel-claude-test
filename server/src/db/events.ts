import { If } from "../util/types";
import {
  OrganizationUsageLimitName,
  PetitionEvent as DbPetitionEvent,
  PetitionEventType,
  PetitionPermissionType,
  PetitionSignatureCancelReason,
  PetitionStatus,
  SystemEvent as DbSystemEvent,
  SystemEventType,
} from "./__types";

export type PetitionEventPayload<TType extends PetitionEventType> = {
  PETITION_CREATED: { user_id: number };
  PETITION_COMPLETED: { petition_access_id?: number; user_id?: number }; //id of the User or PetitionAccess that completed the petition. Only one will be defined
  ACCESS_ACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_DEACTIVATED: {
    petition_access_id: number;
    user_id?: number; // if user_id is undefined, the access was deactivated automatically because an email bounce ocurred
    reason: "DEACTIVATED_BY_USER" | "EMAIL_BOUNCED";
  };
  ACCESS_OPENED: { petition_access_id: number };
  ACCESS_DELEGATED: {
    new_petition_access_id: number; // new petition access created by the contact
    petition_access_id: number; // original access from where the delegation ocurred
  };
  MESSAGE_SCHEDULED: { petition_message_id: number };
  MESSAGE_CANCELLED: {
    petition_message_id: number;
    user_id?: number; // if user_id is undefined, the message was cancelled automatically because an email bounce ocurred
    reason: "CANCELLED_BY_USER" | "EMAIL_BOUNCED";
  };
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
    is_internal?: boolean;
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
  SIGNATURE_OPENED: {
    petition_signature_request_id: number;
    signer: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  SIGNATURE_STARTED: {
    petition_signature_request_id: number;
    email_delivered_at?: Date;
    email_opened_at?: Date;
    email_bounced_at?: Date;
  };
  SIGNATURE_CANCELLED: {
    petition_signature_request_id?: number; // if signature was cancelled because of lack of credits, the petition_signature_request_id will be undefined
    cancel_reason: PetitionSignatureCancelReason;
    cancel_data?: any; // cancel_data structure varies with cancel_reason. see PetitionRepository.PetitionSignatureRequestCancelData
  };
  SIGNATURE_COMPLETED: {
    petition_signature_request_id: number;
    file_upload_id: number;
  };
  SIGNATURE_REMINDER: {
    user_id: number; // id of the user that triggered the reminders
    petition_signature_request_id: number;
  };
  RECIPIENT_SIGNED: {
    petition_signature_request_id: number;
    signer: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  TEMPLATE_USED: {
    new_petition_id: number;
    org_id: number;
    user_id: number;
  };
  PETITION_CLONED: {
    new_petition_id: number;
    org_id: number;
    user_id: number;
    type: "PETITION" | "TEMPLATE";
  };
  PETITION_DELETED: {
    user_id: number;
    status: PetitionStatus;
  };
  REMINDERS_OPT_OUT: {
    petition_access_id: number;
    reason: string;
    other?: string;
    referer?: string | null;
  };
  ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK: {
    petition_access_id: number;
  };
  PETITION_MESSAGE_BOUNCED: {
    petition_message_id: number;
  };
  PETITION_REMINDER_BOUNCED: {
    petition_reminder_id: number;
  };
  PETITION_ANONYMIZED: {};
}[TType];

export type GenericPetitionEvent<
  TType extends PetitionEventType,
  IsCreate extends boolean = false
> = Omit<DbPetitionEvent, "type" | "data" | If<IsCreate, "id" | "created_at">> & {
  type: TType;
  data: PetitionEventPayload<TType>;
};

export type PetitionCreatedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_CREATED",
  IsCreate
>;
export type PetitionCompletedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_COMPLETED",
  IsCreate
>;
export type AccessActivatedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "ACCESS_ACTIVATED",
  IsCreate
>;
export type AccessDeactivatedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "ACCESS_DEACTIVATED",
  IsCreate
>;
export type AccessOpenedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "ACCESS_OPENED",
  IsCreate
>;
export type AccessDelegatedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "ACCESS_DELEGATED",
  IsCreate
>;
export type MessageScheduledEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "MESSAGE_SCHEDULED",
  IsCreate
>;
export type MessageCancelledEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "MESSAGE_CANCELLED",
  IsCreate
>;
export type MessageSentEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "MESSAGE_SENT",
  IsCreate
>;
export type ReminderSentEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "REMINDER_SENT",
  IsCreate
>;
export type ReplyCreatedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "REPLY_CREATED",
  IsCreate
>;
export type ReplyUpdatedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "REPLY_UPDATED",
  IsCreate
>;
export type ReplyDeletedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "REPLY_DELETED",
  IsCreate
>;
export type CommentPublishedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "COMMENT_PUBLISHED",
  IsCreate
>;
export type CommentDeletedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "COMMENT_DELETED",
  IsCreate
>;
export type UserPermissionAddedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "USER_PERMISSION_ADDED",
  IsCreate
>;
export type UserPermissionRemovedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "USER_PERMISSION_REMOVED",
  IsCreate
>;
export type UserPermissionEditedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "USER_PERMISSION_EDITED",
  IsCreate
>;
export type GroupPermissionAddedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "GROUP_PERMISSION_ADDED",
  IsCreate
>;
export type GroupPermissionEditedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "GROUP_PERMISSION_EDITED",
  IsCreate
>;
export type GroupPermissionRemovedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "GROUP_PERMISSION_REMOVED",
  IsCreate
>;

export type OwnershipTransferredEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "OWNERSHIP_TRANSFERRED",
  IsCreate
>;
export type PetitionClosedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_CLOSED",
  IsCreate
>;
export type PetitionClosedNotifiedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_CLOSED_NOTIFIED",
  IsCreate
>;
export type PetitionReopenedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_REOPENED",
  IsCreate
>;
export type SignatureOpenedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "SIGNATURE_OPENED",
  IsCreate
>;
export type SignatureStartedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "SIGNATURE_STARTED",
  IsCreate
>;
export type SignatureCompletedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "SIGNATURE_COMPLETED",
  IsCreate
>;
export type SignatureCancelledEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "SIGNATURE_CANCELLED",
  IsCreate
>;
export type SignatureReminderEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "SIGNATURE_REMINDER",
  IsCreate
>;
export type TemplateUsedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "TEMPLATE_USED",
  IsCreate
>;
export type PetitionClonedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_CLONED",
  IsCreate
>;
export type PetitionDeletedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_DELETED",
  IsCreate
>;
export type RemindersOptOutEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "REMINDERS_OPT_OUT",
  IsCreate
>;

export type AccessActivatedFromPublicPetitionLinkEvent<IsCreate extends boolean = false> =
  GenericPetitionEvent<"ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK", IsCreate>;

export type RecipientSignedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "RECIPIENT_SIGNED",
  IsCreate
>;

export type PetitionReminderBouncedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_REMINDER_BOUNCED",
  IsCreate
>;

export type PetitionMessageBouncedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_MESSAGE_BOUNCED",
  IsCreate
>;

export type PetitionAnonymizedEvent<IsCreate extends boolean = false> = GenericPetitionEvent<
  "PETITION_ANONYMIZED",
  IsCreate
>;

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
  | SignatureOpenedEvent<IsCreate>
  | SignatureStartedEvent<IsCreate>
  | SignatureCompletedEvent<IsCreate>
  | SignatureCancelledEvent<IsCreate>
  | SignatureReminderEvent<IsCreate>
  | TemplateUsedEvent<IsCreate>
  | PetitionClonedEvent<IsCreate>
  | PetitionDeletedEvent<IsCreate>
  | RemindersOptOutEvent<IsCreate>
  | AccessActivatedFromPublicPetitionLinkEvent<IsCreate>
  | RecipientSignedEvent<IsCreate>
  | PetitionReminderBouncedEvent<IsCreate>
  | PetitionMessageBouncedEvent<IsCreate>
  | PetitionAnonymizedEvent<IsCreate>;

export type CreatePetitionEvent = PetitionEvent<true>;

export type SystemEventPayload<TType extends SystemEventType> = {
  USER_LOGGED_IN: {
    user_id: number;
  };
  USER_CREATED: {
    user_id: number;
    from: "sign-up" | "invitation";
  };
  EMAIL_VERIFIED: {
    user_id: number;
  };
  INVITE_SENT: {
    invited_by: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  EMAIL_OPENED: {
    type: "petition-message" | "petition-reminder";
    petition_id: number;
    petition_message_id?: number;
    petition_reminder_id?: number;
    user_agent: string;
  };
  ORGANIZATION_LIMIT_REACHED: {
    org_id: number;
    limit_name: OrganizationUsageLimitName;
    used: number;
    total: number;
    period_start_date: Date;
    period_end_date: Date;
  };
}[TType];

type GenericSystemEvent<TType extends SystemEventType, IsCreate extends boolean = false> = Omit<
  DbSystemEvent,
  "type" | "data" | If<IsCreate, "id" | "created_at">
> & {
  type: TType;
  data: SystemEventPayload<TType>;
};

export type UserCreatedEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "USER_CREATED",
  IsCreate
>;
export type UserLoggedInEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "USER_LOGGED_IN",
  IsCreate
>;

export type EmailVerifiedSystemEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "EMAIL_VERIFIED",
  IsCreate
>;

export type InviteSentSystemEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "INVITE_SENT",
  IsCreate
>;
export type EmailOpenedSystemEvent<IsCreate extends boolean = false> = GenericSystemEvent<
  "EMAIL_OPENED",
  IsCreate
>;

export type OrganizationLimitReachedSystemEvent<IsCreate extends boolean = false> =
  GenericSystemEvent<"ORGANIZATION_LIMIT_REACHED", IsCreate>;

export type SystemEvent<IsCreate extends boolean = false> =
  | UserCreatedEvent<IsCreate>
  | UserLoggedInEvent<IsCreate>
  | EmailVerifiedSystemEvent<IsCreate>
  | InviteSentSystemEvent<IsCreate>
  | EmailOpenedSystemEvent<IsCreate>
  | OrganizationLimitReachedSystemEvent<IsCreate>;

export type CreateSystemEvent = SystemEvent<true>;
