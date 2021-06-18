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
    user_ids: number[];
    user_group_ids: number[];
  };
  SIGNATURE_CANCELLED: {
    // one or the other
    user_id?: number;
    contact_id?: number;
  };
  SIGNATURE_COMPLETED: {
    contact_id: number;
  };
}[TType];

type GenericPetitionUserNotification<
  TType extends PetitionUserNotificationType,
  IsCreate extends boolean = false
> = Omit<
  DbPetitionUserNotification,
  "type" | "data" | (IsCreate extends true ? "id" | "created_at" : never)
> & {
  type: TType;
  data: PetitionUserNotificationPayload<TType>;
};

export type CommentCreatedNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"COMMENT_CREATED", IsCreate>;
export type MessageEmailBouncedNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"MESSAGE_EMAIL_BOUNCED", IsCreate>;
export type PetitionCompletedNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"PETITION_COMPLETED", IsCreate>;
export type PetitionSharedNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"PETITION_SHARED", IsCreate>;
export type SignatureCancelledNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"SIGNATURE_CANCELLED", IsCreate>;
export type SignatureCompletedNotification<IsCreate extends boolean = false> =
  GenericPetitionUserNotification<"SIGNATURE_COMPLETED", IsCreate>;

export type PetitionUserNotification<IsCreate extends boolean = false> =
  | CommentCreatedNotification<IsCreate>
  | MessageEmailBouncedNotification<IsCreate>
  | PetitionCompletedNotification<IsCreate>
  | PetitionSharedNotification<IsCreate>
  | SignatureCancelledNotification<IsCreate>
  | SignatureCompletedNotification<IsCreate>;

export type CreatePetitionUserNotification = PetitionUserNotification<true>;
