import * as Knex from "knex";
import { sortBy } from "remeda";

type Maybe<T> = T | null;

interface PetitionAccess {
  id: number;
  petition_id: number;
  granter_id: number;
  contact_id: number;
  keycode: string;
  status: "ACTIVE" | "INACTIVE";
  next_reminder_at: Maybe<Date>;
  reminders_active: boolean;
  reminders_config: Maybe<any>;
  reminders_left: number;
  created_at: Date;
  created_by: Maybe<string>;
  updated_at: Date;
  updated_by: Maybe<string>;
}

interface PetitionMessage {
  id: number;
  petition_id: number;
  petition_access_id: number;
  sender_id: number;
  email_subject: Maybe<string>;
  email_body: Maybe<string>;
  status: "SCHEDULED" | "CANCELLED" | "PROCESSING" | "PROCESSED";
  scheduled_at: Maybe<Date>;
  email_log_id: Maybe<number>;
  created_at: Date;
  created_by: Maybe<string>;
}

interface PetitionReminder {
  id: number;
  petition_sendout_id: number;
  email_log_id: Maybe<number>;
  type: "MANUAL" | "AUTOMATIC";
  status: "PROCESSING" | "PROCESSED";
  created_at: Date;
  created_by: Maybe<string>;
  sender_id: Maybe<number>;
  petition_access_id: Maybe<number>;
}

interface PetitionEvent {
  id: number;
  petition_id: number;
  type:
    | "ACCESS_ACTIVATED"
    | "ACCESS_DEACTIVATED"
    | "MESSAGE_SCHEDULED"
    | "MESSAGE_CANCELLED"
    | "MESSAGE_PROCESSED"
    | "REMINDER_PROCESSED";
  data: any;
  created_at: Date;
}

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("petition_event", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.enum(
      "type",
      [
        "ACCESS_ACTIVATED",
        "ACCESS_DEACTIVATED",
        "MESSAGE_SCHEDULED",
        "MESSAGE_CANCELLED",
        "MESSAGE_PROCESSED",
        "REMINDER_PROCESSED",
      ],
      {
        useNative: true,
        enumName: "petition_event_type",
      }
    ).notNullable();
    t.jsonb("data");
    t.timestamp("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));

    t.index(["petition_id", "type"], "petition_event__petition_id__type");
  });

  const accesses = await knex<PetitionAccess>("petition_access");
  const messages = await knex<PetitionMessage>("petition_message");
  const reminders = await knex<PetitionReminder>("petition_reminder");
  const events: Omit<PetitionEvent, "id">[] = [];
  for (const access of accesses) {
    events.push({
      petition_id: access.petition_id,
      type: "ACCESS_ACTIVATED",
      data: { petition_access_id: access.id },
      created_at: access.created_at,
    });
  }
  for (const message of messages) {
    events.push({
      petition_id: message.petition_id,
      type: message.scheduled_at ? "MESSAGE_SCHEDULED" : "MESSAGE_PROCESSED",
      data: { petition_message_id: message.id },
      created_at: message.created_at,
    });
    if (message.scheduled_at && message.status === "PROCESSED") {
      events.push({
        petition_id: message.petition_id,
        type: "MESSAGE_PROCESSED",
        data: { petition_message_id: message.id },
        created_at: message.scheduled_at,
      });
    }
  }
  for (const reminder of reminders) {
    const access = accesses.find((a) => a.id === reminder.petition_access_id)!;
    events.push({
      petition_id: access.petition_id,
      type: "REMINDER_PROCESSED",
      data: { petition_access_id: reminder.petition_access_id },
      created_at: reminder.created_at,
    });
  }
  await knex("petition_event").insert(sortBy(events, (e) => e.created_at));
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("petition_event");
  await knex.raw(/* sql */ `drop type petition_event_type`);
}
