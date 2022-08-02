import { If } from "../util/types";
import {
  PetitionSignatureCancelReason,
  PetitionUserNotification as DbPetitionUserNotification,
  PetitionUserNotificationType,
} from "./__types";

export type PetitionUserNotificationPayload<TType extends PetitionUserNotificationType> = {
  COMMENT_CREATED: {
    petition_field_id: number;
    petition_field_comment_id: number;
    /** if true, notified user is mentioned on the comment */
    is_mentioned: boolean;
  };
  MESSAGE_EMAIL_BOUNCED: {
    petition_access_id: number;
  };
  REMINDER_EMAIL_BOUNCED: {
    petition_access_id: number;
  };
  PETITION_COMPLETED: {
    // one or the other, depending on who completed
    user_id?: number;
    petition_access_id?: number;
  };
  PETITION_SHARED: {
    owner_id: number;
    permission_type: "READ" | "WRITE";
    user_id?: number;
    user_group_id?: number;
  };
  SIGNATURE_CANCELLED: {
    petition_signature_request_id: number;
    cancel_reason?: PetitionSignatureCancelReason;
    cancel_data?: any;
  };
  SIGNATURE_COMPLETED: {
    petition_signature_request_id: number;
  };
  REMINDERS_OPT_OUT: {
    petition_access_id: number;
    reason: string;
    other?: string;
  };
  ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK: {
    petition_access_id: number;
  };
}[TType];

export type GenericPetitionUserNotification<
  TType extends PetitionUserNotificationType,
  IsCreate extends boolean = false
> = Omit<
  DbPetitionUserNotification,
  "type" | "data" | If<IsCreate, "id" | "created_at" | "is_read" | "processed_at">
> & {
  type: TType;
  data: PetitionUserNotificationPayload<TType>;
};

export type CommentCreatedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"COMMENT_CREATED", IsCreate>;
export type MessageEmailBouncedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"MESSAGE_EMAIL_BOUNCED", IsCreate>;
export type ReminderEmailBouncedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"REMINDER_EMAIL_BOUNCED", IsCreate>;
export type PetitionCompletedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"PETITION_COMPLETED", IsCreate>;
export type PetitionSharedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"PETITION_SHARED", IsCreate>;
export type SignatureCancelledUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"SIGNATURE_CANCELLED", IsCreate>;
export type SignatureCompletedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"SIGNATURE_COMPLETED", IsCreate>;
export type RemindersOptOutNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"REMINDERS_OPT_OUT", IsCreate>;
export type AccessActivatedFromPublicPetitionLinkUserNotification<
  IsCreate extends boolean = false
> = GenericPetitionUserNotification<"ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK", IsCreate>;

export type PetitionUserNotification<IsCreate extends boolean = false> =
  | CommentCreatedUserNotification<IsCreate>
  | MessageEmailBouncedUserNotification<IsCreate>
  | ReminderEmailBouncedUserNotification<IsCreate>
  | PetitionCompletedUserNotification<IsCreate>
  | PetitionSharedUserNotification<IsCreate>
  | SignatureCancelledUserNotification<IsCreate>
  | SignatureCompletedUserNotification<IsCreate>
  | RemindersOptOutNotification<IsCreate>
  | AccessActivatedFromPublicPetitionLinkUserNotification<IsCreate>;

export type CreatePetitionUserNotification = PetitionUserNotification<true>;
