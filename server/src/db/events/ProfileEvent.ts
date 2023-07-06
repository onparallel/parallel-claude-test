import { If } from "../../util/types";
import { ProfileEvent as DbProfileEvent, ProfileEventType } from "../__types";

export type ProfileEventPayload<TType extends ProfileEventType> = {
  PROFILE_CREATED: {
    user_id: number;
  };
  PROFILE_FIELD_VALUE_UPDATED: {
    user_id: number;
    profile_type_field_id: number;
    current_profile_field_value_id: number | null;
    previous_profile_field_value_id: number | null;
  };
  PROFILE_FIELD_FILE_ADDED: {
    user_id: number;
    profile_type_field_id: number;
    profile_field_file_id: number;
  };
  PROFILE_FIELD_FILE_REMOVED: {
    user_id: number;
    profile_type_field_id: number;
    profile_field_file_id: number;
  };
  PROFILE_FIELD_EXPIRY_UPDATED: {
    user_id: number;
    profile_type_field_id: number;
    expiry_date: string | null;
  };
  PETITION_ASSOCIATED: {
    user_id: number;
    petition_id: number;
  };
  PETITION_DISASSOCIATED: {
    user_id: number;
    petition_id: number;
  };
}[TType];

export type GenericProfileEvent<
  TType extends ProfileEventType,
  IsCreate extends boolean = false
> = Omit<DbProfileEvent, "type" | "data" | If<IsCreate, "id" | "created_at" | "processed_at">> & {
  type: TType;
  data: ProfileEventPayload<TType>;
};

export type ProfileCreatedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_CREATED",
  IsCreate
>;
export type ProfileFieldValueUpdatedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_FIELD_VALUE_UPDATED",
  IsCreate
>;
export type ProfileFieldFileAddedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_FIELD_FILE_ADDED",
  IsCreate
>;
export type ProfileFieldFileRemovedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_FIELD_FILE_REMOVED",
  IsCreate
>;
export type ProfileFieldExpiryUpdatedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_FIELD_EXPIRY_UPDATED",
  IsCreate
>;
export type PetitionAssociatedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PETITION_ASSOCIATED",
  IsCreate
>;
export type PetitionDisassociatedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PETITION_DISASSOCIATED",
  IsCreate
>;

export type ProfileEvent<IsCreate extends boolean = false> =
  | ProfileCreatedEvent<IsCreate>
  | ProfileFieldValueUpdatedEvent<IsCreate>
  | ProfileFieldFileAddedEvent<IsCreate>
  | ProfileFieldFileRemovedEvent<IsCreate>
  | ProfileFieldExpiryUpdatedEvent<IsCreate>
  | PetitionAssociatedEvent<IsCreate>
  | PetitionDisassociatedEvent<IsCreate>;

export type CreateProfileEvent = ProfileEvent<true>;
