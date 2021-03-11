import { Knex } from "knex";
import { sortBy } from "remeda";

type Maybe<T> = T | null;

export interface Petition {
  id: number;
  org_id: number;
  owner_id: number;
  name: Maybe<string>;
  custom_ref: Maybe<string>;
  locale: string;
  is_template: boolean;
  status: Maybe<"DRAFT" | "PENDING" | "COMPLETED">;
  deadline: Maybe<Date>;
  email_subject: Maybe<string>;
  email_body: Maybe<string>;
  reminders_active: boolean;
  created_at: Date;
  created_by: Maybe<string>;
  updated_at: Date;
  updated_by: Maybe<string>;
  deleted_at: Maybe<Date>;
  deleted_by: Maybe<string>;
  reminders_config: Maybe<any>;
}

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
    | "PETITION_CREATED"
    | "PETITION_COMPLETED"
    | "ACCESS_ACTIVATED"
    | "ACCESS_OPENED"
    | "ACCESS_DEACTIVATED"
    | "MESSAGE_SCHEDULED"
    | "MESSAGE_CANCELLED"
    | "MESSAGE_SENT"
    | "REMINDER_SENT"
    | "REPLY_CREATED"
    | "REPLY_DELETED";
  data: any;
  created_at: Date;
}

export interface PetitionFieldReply {
  id: number;
  petition_field_id: number;
  petition_sendout_id: Maybe<number>;
  type: "FILE_UPLOAD" | "TEXT";
  content: any;
  created_at: Date;
  created_by: Maybe<string>;
  updated_at: Date;
  updated_by: Maybe<string>;
  deleted_at: Maybe<Date>;
  deleted_by: Maybe<string>;
  petition_access_id: number;
}

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("petition_event", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.enum(
      "type",
      [
        "PETITION_CREATED",
        "PETITION_COMPLETED",
        "ACCESS_ACTIVATED",
        "ACCESS_DEACTIVATED",
        "ACCESS_OPENED",
        "MESSAGE_SCHEDULED",
        "MESSAGE_CANCELLED",
        "MESSAGE_SENT",
        "REMINDER_SENT",
        "REPLY_CREATED",
        "REPLY_DELETED",
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

  const events: Omit<PetitionEvent, "id">[] = [];
  const petitions = await knex<Petition>("petition");
  for (const petition of petitions) {
    events.push({
      petition_id: petition.id,
      type: "PETITION_CREATED",
      data: {
        user_id: petition.owner_id,
      },
      created_at: petition.created_at,
    });
  }
  const accesses = await knex<PetitionAccess>("petition_access");
  for (const access of accesses) {
    events.push({
      petition_id: access.petition_id,
      type: "ACCESS_ACTIVATED",
      data: {
        user_id: access.granter_id,
        petition_access_id: access.id,
      },
      created_at: access.created_at,
    });
    if (access.status === "INACTIVE") {
      events.push({
        petition_id: access.petition_id,
        type: "ACCESS_DEACTIVATED",
        data: {
          user_id: access.granter_id,
          petition_access_id: access.id,
        },
        created_at: access.updated_at,
      });
    }
  }
  const messages = await knex<PetitionMessage>("petition_message");
  for (const message of messages) {
    events.push({
      petition_id: message.petition_id,
      type: message.scheduled_at ? "MESSAGE_SCHEDULED" : "MESSAGE_SENT",
      data: {
        petition_message_id: message.id,
      },
      created_at: message.created_at,
    });
    if (message.scheduled_at && message.status === "PROCESSED") {
      events.push({
        petition_id: message.petition_id,
        type: "MESSAGE_SENT",
        data: {
          petition_message_id: message.id,
        },
        created_at: message.scheduled_at,
      });
    }
  }
  const reminders = await knex<PetitionReminder>("petition_reminder");
  for (const reminder of reminders) {
    const access = accesses.find((a) => a.id === reminder.petition_access_id)!;
    events.push({
      petition_id: access.petition_id,
      type: "REMINDER_SENT",
      data: {
        petition_reminder_id: reminder.id,
      },
      created_at: reminder.created_at,
    });
  }
  const replies: (PetitionFieldReply & {
    petition_id: number;
  })[] = (
    await knex.raw(/* sql */ `
    select pfr.*, pf.petition_id from petition_field_reply as pfr join petition_field as pf on pf.id = pfr.petition_field_id
  `)
  ).rows;
  for (const reply of replies) {
    events.push({
      petition_id: reply.petition_id,
      type: "REPLY_CREATED",
      data: {
        petition_access_id: reply.petition_access_id,
        petition_field_id: reply.petition_field_id,
        petition_field_reply_id: reply.id,
      },
      created_at: reply.created_at,
    });
    if (reply.deleted_at) {
      events.push({
        petition_id: reply.petition_id,
        type: "REPLY_DELETED",
        data: {
          petition_access_id: reply.petition_access_id,
          petition_field_id: reply.petition_field_id,
          petition_field_reply_id: reply.id,
        },
        created_at: reply.deleted_at,
      });
    }
  }
  if (events.length) {
    await knex("petition_event").insert(sortBy(events, (e) => e.created_at));
  }
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.dropTable("petition_event");
  await knex.raw(/* sql */ `drop type petition_event_type`);
}
