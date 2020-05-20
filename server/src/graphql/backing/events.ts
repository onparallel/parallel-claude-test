import { PetitionEventType } from "../../db/__types";

type GenericPetitionEvent<TType extends PetitionEventType, TData extends {}> = {
  id: number;
  type: TType;
  data: TData;
  created_at: Date;
};

type AccessPetitionEvent<
  TType extends PetitionEventType
> = GenericPetitionEvent<TType, { petition_access_id: number }>;

type MessagePetitionEvent<
  TType extends PetitionEventType
> = GenericPetitionEvent<
  TType,
  { petition_access_id: number; petition_message_id: number }
>;

export type AccessActivatedEvent = AccessPetitionEvent<"ACCESS_ACTIVATED">;

export type AccessDeactivatedEvent = AccessPetitionEvent<"ACCESS_DEACTIVATED">;

export type MessageScheduledEvent = MessagePetitionEvent<"MESSAGE_SCHEDULED">;

export type MessageCancelledEvent = MessagePetitionEvent<"MESSAGE_CANCELLED">;

export type MessageProcessedEvent = MessagePetitionEvent<"MESSAGE_PROCESSED">;

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
