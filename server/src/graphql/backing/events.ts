import { PetitionEventType } from "../../db/__types";

type GenericPetitionEvent<TType extends PetitionEventType, TData extends {}> = {
  id: number;
  type: TType;
  data: TData;
  created_at: Date;
};

export type AccessActivatedEvent = GenericPetitionEvent<
  "ACCESS_ACTIVATED",
  { petition_access_id: number; user_id: number }
>;

export type AccessDeactivatedEvent = GenericPetitionEvent<
  "ACCESS_DEACTIVATED",
  { petition_access_id: number; user_id: number }
>;

export type MessageScheduledEvent = GenericPetitionEvent<
  "MESSAGE_SCHEDULED",
  { petition_access_id: number; petition_message_id: number }
>;

export type MessageCancelledEvent = GenericPetitionEvent<
  "MESSAGE_CANCELLED",
  { petition_access_id: number; petition_message_id: number }
>;

export type MessageProcessedEvent = GenericPetitionEvent<
  "MESSAGE_PROCESSED",
  { petition_access_id: number; petition_message_id: number }
>;

export type ReminderProcessedEvent = GenericPetitionEvent<
  "REMINDER_PROCESSED",
  { petition_access_id: number; petition_reminder_id: number }
>;

export type PetitionEvent =
  | AccessActivatedEvent
  | AccessDeactivatedEvent
  | MessageScheduledEvent
  | MessageCancelledEvent
  | MessageProcessedEvent
  | ReminderProcessedEvent;
