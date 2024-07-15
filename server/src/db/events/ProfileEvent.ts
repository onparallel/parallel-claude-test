import { If } from "../../util/types";
import { ProfileEvent as DbProfileEvent, ProfileEventType } from "../__types";

export type ProfileEventPayload<TType extends ProfileEventType> = {
  PROFILE_CREATED: {
    user_id: number;
  };
  PROFILE_FIELD_VALUE_UPDATED: {
    user_id: number | null; // null means value was updated by monitor cron
    profile_type_field_id: number;
    current_profile_field_value_id: number | null;
    previous_profile_field_value_id: number | null;
    alias: string | null;
  };
  PROFILE_FIELD_FILE_ADDED: {
    user_id: number;
    profile_type_field_id: number;
    profile_field_file_id: number;
    alias: string | null;
  };
  PROFILE_FIELD_FILE_REMOVED: {
    user_id: number;
    profile_type_field_id: number;
    profile_field_file_id: number;
    alias: string | null;
  };
  PROFILE_FIELD_EXPIRY_UPDATED: {
    user_id: number | null; // null means value was updated by monitor cron
    profile_type_field_id: number;
    expiry_date: string | null;
    alias: string | null;
  };
  PETITION_ASSOCIATED: {
    user_id: number;
    petition_id: number;
  };
  PETITION_DISASSOCIATED: {
    user_id?: number;
    petition_access_id?: number;
    petition_id: number;
  };
  PROFILE_CLOSED: {
    user_id: number;
  };
  PROFILE_SCHEDULED_FOR_DELETION: {
    user_id: number;
  };
  PROFILE_REOPENED: {
    user_id: number;
  };
  PROFILE_ANONYMIZED: {};
  PROFILE_UPDATED: {
    user_id: number | null; // null means profile was updated by monitoring rules
  };
  PROFILE_RELATIONSHIP_CREATED: {
    user_id: number;
    profile_relationship_id: number;
    profile_relationship_type_alias: string | null;
  };
  PROFILE_RELATIONSHIP_REMOVED: {
    user_id: number | null;
    profile_relationship_id: number;
    profile_relationship_type_alias: string | null;
    reason: string;
  };
}[TType];

export type GenericProfileEvent<
  TType extends ProfileEventType,
  IsCreate extends boolean = false,
> = Omit<
  DbProfileEvent,
  "type" | "data" | If<IsCreate, "id" | "created_at" | "processed_at" | "processed_by">
> & {
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
export type ProfileClosedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_CLOSED",
  IsCreate
>;
export type ProfileScheduledForDeletionEvent<IsCreate extends boolean = false> =
  GenericProfileEvent<"PROFILE_SCHEDULED_FOR_DELETION", IsCreate>;
export type ProfileReopenedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_REOPENED",
  IsCreate
>;
export type ProfileAnonymizedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_ANONYMIZED",
  IsCreate
>;
export type ProfileUpdatedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_UPDATED",
  IsCreate
>;
export type ProfileRelationshipCreatedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_RELATIONSHIP_CREATED",
  IsCreate
>;
export type ProfileRelationshipRemovedEvent<IsCreate extends boolean = false> = GenericProfileEvent<
  "PROFILE_RELATIONSHIP_REMOVED",
  IsCreate
>;

export type ProfileEvent<IsCreate extends boolean = false> =
  | ProfileCreatedEvent<IsCreate>
  | ProfileFieldValueUpdatedEvent<IsCreate>
  | ProfileFieldFileAddedEvent<IsCreate>
  | ProfileFieldFileRemovedEvent<IsCreate>
  | ProfileFieldExpiryUpdatedEvent<IsCreate>
  | PetitionAssociatedEvent<IsCreate>
  | PetitionDisassociatedEvent<IsCreate>
  | ProfileClosedEvent<IsCreate>
  | ProfileScheduledForDeletionEvent<IsCreate>
  | ProfileReopenedEvent<IsCreate>
  | ProfileAnonymizedEvent<IsCreate>
  | ProfileUpdatedEvent<IsCreate>
  | ProfileRelationshipCreatedEvent<IsCreate>
  | ProfileRelationshipRemovedEvent<IsCreate>;

export type CreateProfileEvent = ProfileEvent<true>;
