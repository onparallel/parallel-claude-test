import { PetitionEventType } from "../../db/__types";

export type PetitionEventPayload = {
  ACCESS_ACTIVATED: { petition_access_id: number; user_id: number };
  ACCESS_DEACTIVATED: { petition_access_id: number; user_id: number };
  MESSAGE_SCHEDULED: {
    petition_access_id: number;
    petition_message_id: number;
  };
  MESSAGE_CANCELLED: {
    petition_access_id: number;
    petition_message_id: number;
  };
  MESSAGE_PROCESSED: {
    petition_access_id: number;
    petition_message_id: number;
  };
  REMINDER_PROCESSED: {
    petition_access_id: number;
    petition_reminder_id: number;
  };
};

type GenericPetitionEvent<TType extends PetitionEventType> = {
  id: number;
  type: TType;
  data: PetitionEventPayload[TType];
  created_at: Date;
};

export type AccessActivatedEvent = GenericPetitionEvent<"ACCESS_ACTIVATED">;
export type AccessDeactivatedEvent = GenericPetitionEvent<"ACCESS_DEACTIVATED">;
export type MessageScheduledEvent = GenericPetitionEvent<"MESSAGE_SCHEDULED">;
export type MessageCancelledEvent = GenericPetitionEvent<"MESSAGE_CANCELLED">;
export type MessageProcessedEvent = GenericPetitionEvent<"MESSAGE_PROCESSED">;
export type ReminderProcessedEvent = GenericPetitionEvent<"REMINDER_PROCESSED">;

export type PetitionEvent =
  | AccessActivatedEvent
  | AccessDeactivatedEvent
  | MessageScheduledEvent
  | MessageCancelledEvent
  | MessageProcessedEvent
  | ReminderProcessedEvent;
