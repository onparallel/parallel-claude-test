import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  await knex.schema
    .createTable("petition_access", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.integer("granter_id").notNullable().references("user.id");
      t.integer("contact_id").notNullable().references("contact.id");
      t.string("keycode").notNullable().unique("petition_access__keycode");
      t.enum("status", ["ACTIVE", "INACTIVE"], {
        useNative: true,
        enumName: "petition_access_status",
      }).notNullable();
      t.timestamp("next_reminder_at");
      t.boolean("reminders_active").notNullable().defaultTo(false);
      t.jsonb("reminders_config");
      t.integer("reminders_left").notNullable().defaultTo(0);
      timestamps(t, { deleted: false });

      t.unique(
        ["petition_id", "contact_id"],
        "petition_access__petition_id_contact_id"
      );

      t.index(["petition_id"], "petition_access__petition_id");
      t.index(["contact_id"], "petition_access__contact_id");
    })
    .raw(
      /* sql */ `
      alter table petition_access add constraint petition_access__reminders_check check (
        (reminders_active and reminders_config is not null)
          or (not reminders_active and reminders_config is null)
      )
      `
    )
    .raw(
      /* sql */ `
      alter table petition_access add constraint petition_access__reminders_left_check check (
        reminders_left >= 0
      )
      `
    )
    .createTable("petition_message", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.integer("petition_access_id")
        .notNullable()
        .references("petition_access.id");
      t.integer("sender_id").notNullable().references("user.id");
      t.string("email_subject");
      t.text("email_body");
      t.enum("status", ["SCHEDULED", "CANCELLED", "PROCESSING", "PROCESSED"], {
        useNative: true,
        enumName: "petition_message_status",
      }).notNullable();
      t.timestamp("scheduled_at");
      t.integer("email_log_id").references("email_log.id");
      timestamps(t, { updated: false, deleted: false });

      t.index(["petition_id"], "petition_message__petition_id");
      t.index(["petition_access_id"], "petition_message__petition_access_id");
    })
    .alterTable("petition_reminder", (t) => {
      t.integer("petition_access_id").references("petition_access.id");
    })
    .alterTable("petition_field_reply", (t) => {
      t.integer("petition_access_id").references("petition_access.id");
    });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema
    .alterTable("petition_field_reply", (t) => {
      t.dropColumn("petition_access_id");
    })
    .alterTable("petition_reminder", (t) => {
      t.dropColumn("petition_access_id");
    })
    .dropTable("petition_message")
    .dropTable("petition_access")
    .raw(/* sql */ `drop type petition_message_status`)
    .raw(/* sql */ `drop type petition_access_status`);
}
