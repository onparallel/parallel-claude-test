import { PetitionEventType } from "../../db/__types";

export type PetitionEventPayload = {
  PETITION_CREATED: { user_id: number };
  PETITION_COMPLETED: { petition_access_id: number };
  ACCESS_ACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_DEACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_OPENED: { petition_access_id: number };
  MESSAGE_SCHEDULED: { petition_message_id: number };
  MESSAGE_CANCELLED: { petition_message_id: number };
  MESSAGE_PROCESSED: { petition_message_id: number };
  REMINDER_PROCESSED: { petition_reminder_id: number };
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
};

type GenericPetitionEvent<TType extends PetitionEventType> = {
  id: number;
  type: TType;
  data: PetitionEventPayload[TType];
  created_at: Date;
};

export type PetitionCreatedEvent = GenericPetitionEvent<"PETITION_CREATED">;
export type PetitionCompletedEvent = GenericPetitionEvent<"PETITION_COMPLETED">;
export type AccessActivatedEvent = GenericPetitionEvent<"ACCESS_ACTIVATED">;
export type AccessDeactivatedEvent = GenericPetitionEvent<"ACCESS_DEACTIVATED">;
export type AccessOpenedEvent = GenericPetitionEvent<"ACCESS_OPENED">;
export type MessageScheduledEvent = GenericPetitionEvent<"MESSAGE_SCHEDULED">;
export type MessageCancelledEvent = GenericPetitionEvent<"MESSAGE_CANCELLED">;
export type MessageProcessedEvent = GenericPetitionEvent<"MESSAGE_PROCESSED">;
export type ReminderProcessedEvent = GenericPetitionEvent<"REMINDER_PROCESSED">;
export type ReplyCreatedEvent = GenericPetitionEvent<"REPLY_CREATED">;
export type ReplyDeletedEvent = GenericPetitionEvent<"REPLY_DELETED">;

export type PetitionEvent =
  | PetitionCreatedEvent
  | PetitionCompletedEvent
  | AccessActivatedEvent
  | AccessDeactivatedEvent
  | AccessOpenedEvent
  | MessageScheduledEvent
  | MessageCancelledEvent
  | MessageProcessedEvent
  | ReminderProcessedEvent
  | ReplyCreatedEvent
  | ReplyDeletedEvent;
