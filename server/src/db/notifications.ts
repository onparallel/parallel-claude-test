import { If } from "../util/types";
import {
  PetitionUserNotification as DbPetitionUserNotification,
  PetitionUserNotificationType,
} from "./__types";

export type PetitionUserNotificationPayload<
  TType extends PetitionUserNotificationType
> = {
  COMMENT_CREATED: {
    petition_field_id: number;
    petition_field_comment_id: number;
  };
  MESSAGE_EMAIL_BOUNCED: {
    petition_access_id: number;
  };
  PETITION_COMPLETED: {
    petition_access_id: number;
  };
  PETITION_SHARED: {
    owner_id: number;
    permission_type: "READ" | "WRITE";
    user_id?: number;
    user_group_id?: number;
  };
  SIGNATURE_CANCELLED: {
    petition_signature_request_id: number;
  };
  SIGNATURE_COMPLETED: {
    petition_signature_request_id: number;
  };
  CONTACT_UNSUBSCRIBE: { petition_access_id: number };
}[TType];

type GenericPetitionUserNotification<
  TType extends PetitionUserNotificationType,
  IsCreate extends boolean = false
> = Omit<
  DbPetitionUserNotification,
  "type" | "data" | If<IsCreate, "id" | "created_at">
> & {
  type: TType;
  data: PetitionUserNotificationPayload<TType>;
};

export type CommentCreatedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"COMMENT_CREATED", IsCreate>;
export type MessageEmailBouncedUserNotification<
  IsCreate extends boolean = false
> = GenericPetitionUserNotification<"MESSAGE_EMAIL_BOUNCED", IsCreate>;
export type PetitionCompletedUserNotification<
  IsCreate extends boolean = false
> = GenericPetitionUserNotification<"PETITION_COMPLETED", IsCreate>;
export type PetitionSharedUserNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"PETITION_SHARED", IsCreate>;
export type SignatureCancelledUserNotification<
  IsCreate extends boolean = false
> = GenericPetitionUserNotification<"SIGNATURE_CANCELLED", IsCreate>;
export type SignatureCompletedUserNotification<
  IsCreate extends boolean = false
> = GenericPetitionUserNotification<"SIGNATURE_COMPLETED", IsCreate>;
export type ContactUnsubscribeNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"CONTACT_UNSUBSCRIBE", IsCreate>;

export type PetitionUserNotification<IsCreate extends boolean = false> =
  | CommentCreatedUserNotification<IsCreate>
  | MessageEmailBouncedUserNotification<IsCreate>
  | PetitionCompletedUserNotification<IsCreate>
  | PetitionSharedUserNotification<IsCreate>
  | SignatureCancelledUserNotification<IsCreate>
  | SignatureCompletedUserNotification<IsCreate>
  | ContactUnsubscribeNotification<IsCreate>;

export type CreatePetitionUserNotification = PetitionUserNotification<true>;
