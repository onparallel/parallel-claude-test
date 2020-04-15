import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex) {
  return knex.schema
    .createTable("organization", (t) => {
      t.increments("id");
      t.string("name").notNullable();
      t.string("identifier").notNullable();
      t.enum("status", ["DEV", "DEMO", "ACTIVE", "CHURNED"], {
        useNative: true,
        enumName: "organization_status",
      }).notNullable();
      timestamps(t);
    })
    .raw(
      `create unique index "organization__identifier" on "organization" ("identifier") where "deleted_at" is null`
    )

    .createTable("user", (t) => {
      t.increments("id");
      t.string("cognito_id").notNullable();
      t.integer("org_id").notNullable();
      t.enum("organization_role", ["NORMAL", "ADMIN"], {
        useNative: true,
        enumName: "user_organization_role",
      })
        .notNullable()
        .defaultTo("NORMAL");
      t.string("email").notNullable();
      t.string("first_name");
      t.string("last_name");
      timestamps(t);

      t.foreign("org_id").references("organization.id");
    })
    .raw(
      `create unique index "user__email" on "user" ("email") where "deleted_at" is null`
    )

    .createTable("contact", (t) => {
      t.increments("id");
      t.string("email").notNullable();
      t.string("first_name");
      t.string("last_name");
      t.integer("org_id").notNullable();
      t.integer("owner_id").notNullable();
      timestamps(t);

      t.foreign("org_id").references("organization.id");
      t.foreign("owner_id").references("user.id");
    })
    .raw(
      `create unique index "contact__owner_id__email" on "contact" ("owner_id", "email") where "deleted_at" is null`
    )

    .createTable("petition", (t) => {
      t.increments("id");
      t.integer("org_id").notNullable();
      t.integer("owner_id").notNullable();
      t.string("name", 255);
      t.string("custom_ref", 255);
      t.string("locale", 10).notNullable();
      t.boolean("is_template").notNullable().defaultTo(false);
      t.enum("status", ["DRAFT", "PENDING", "COMPLETED"], {
        useNative: true,
        enumName: "petition_status",
      });
      t.timestamp("deadline");
      t.string("email_subject");
      t.string("email_body");
      t.boolean("reminders_active").notNullable().defaultTo(false);
      t.integer("reminders_offset");
      t.string("reminders_time", 5);
      t.string("reminders_timezone");
      t.boolean("reminders_weekdays_only");
      timestamps(t);

      t.foreign("org_id").references("organization.id");
      t.foreign("owner_id").references("user.id");
    })
    .raw(
      `alter table "petition" add constraint "petition__is_template__status" check (
        (not "is_template" and "status" is not null) or ("is_template" and "status" is null)
      )`
    )
    .raw(
      /* sql */ `
      alter table petition add constraint petition__reminders_check check (
        (reminders_active and
          reminders_offset is not null and
          reminders_time is not null and
          reminders_timezone is not null and
          reminders_weekdays_only is not null)
        or
        (not reminders_active and
          reminders_offset is null and
          reminders_time is null and
          reminders_timezone is null and
          reminders_weekdays_only is null)
      )
      `
    )

    .createTable("petition_field", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable();
      t.integer("position").notNullable();
      t.enum("type", ["TEXT", "FILE_UPLOAD"], {
        useNative: true,
        enumName: "petition_field_type",
      }).notNullable();
      t.string("title");
      t.string("description");
      t.boolean("optional").defaultTo(false).notNullable();
      t.boolean("multiple").defaultTo(true).notNullable();
      t.json("options");
      t.boolean("validated").defaultTo(false).notNullable();
      timestamps(t);

      t.foreign("petition_id").references("petition.id");
    })
    .raw(
      `create unique index "petition_field__petition_id__position" on "petition_field" ("petition_id", "position") where "deleted_at" is null`
    )

    .createTable("email_log", (t) => {
      t.increments("id");
      t.text("to").notNullable();
      t.text("from").notNullable();
      t.text("subject").notNullable();
      t.text("text").notNullable();
      t.text("html").notNullable();
      t.boolean("track_opens").notNullable().defaultTo(false);
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
      t.string("created_from").notNullable();
      t.timestamp("sent_at").defaultTo(null);
      t.text("response").defaultTo(null);
      t.string("external_id");

      t.index("external_id", "email_log__external_id");
    })

    .createTable("petition_sendout", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable();
      t.integer("contact_id").notNullable();
      t.integer("sender_id").notNullable();
      t.string("keycode").notNullable();
      t.string("email_subject");
      t.text("email_body");
      t.string("locale", 10).notNullable();
      t.timestamp("deadline");
      t.enum(
        "status",
        ["SCHEDULED", "CANCELLED", "PROCESSING", "ACTIVE", "INACTIVE"],
        { useNative: true, enumName: "petition_sendout_status" }
      ).notNullable();
      t.timestamp("scheduled_at");
      t.integer("email_log_id");
      t.timestamp("next_reminder_at");
      t.boolean("reminders_active").notNullable().defaultTo(false);
      t.integer("reminders_offset");
      t.string("reminders_time", 5);
      t.string("reminders_timezone");
      t.boolean("reminders_weekdays_only");
      t.integer("reminders_left").notNullable().defaultTo(0);
      timestamps(t);

      t.unique(["keycode"], "petition_sendout__keycode");
      t.foreign("petition_id").references("petition.id");
      t.foreign("sender_id").references("user.id");
      t.foreign("email_log_id").references("email_log.id");
    })
    .raw(
      /* sql */ `
      alter table petition_sendout add constraint petition_sendout_reminders_check check (
        (reminders_active and
          reminders_offset is not null and
          reminders_time is not null and
          reminders_timezone is not null and
          reminders_weekdays_only is not null)
        or
        (not reminders_active and
          reminders_offset is null and
          reminders_time is null and
          reminders_timezone is null and
          reminders_weekdays_only is null)
      )
      `
    )

    .createTable("petition_field_reply", (t) => {
      t.increments("id");
      t.integer("petition_field_id").notNullable();
      t.integer("petition_sendout_id").notNullable();
      t.specificType("type", "petition_field_type").notNullable();
      t.json("content").notNullable();
      timestamps(t);

      t.foreign("petition_field_id").references("petition_field.id");
      t.foreign("petition_sendout_id").references("petition_sendout.id");
    })

    .createTable("file_upload", (t) => {
      t.increments("id");
      t.string("path").notNullable();
      t.string("filename").notNullable();
      t.bigInteger("size").notNullable();
      t.string("content_type").notNullable();
      t.boolean("upload_complete").notNullable().defaultTo(false);
      timestamps(t);
    })

    .createTable("petition_reminder", (t) => {
      t.increments("id");
      t.integer("petition_sendout_id").notNullable();
      t.integer("email_log_id");
      t.enum("type", ["MANUAL", "AUTOMATIC"], {
        useNative: true,
        enumName: "petition_reminder_type",
      }).notNullable();
      t.enum("status", ["PROCESSING", "PROCESSED"], {
        enumName: "petition_reminder_status",
        useNative: true,
      }).notNullable();
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
      t.string("created_by");

      t.foreign("petition_sendout_id").references("petition_sendout.id");
      t.foreign("email_log_id").references("email_log.id");
    })

    .createTable("email_event", (t) => {
      t.increments("id");
      t.integer("email_log_id").notNullable();
      t.string("event").notNullable();
      t.text("payload").notNullable();
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));

      t.foreign("email_log_id").references("email_log.id");
      t.index(["email_log_id", "event"], "email_event__email_log_id__event");
    });
}

export async function down(knex: Knex) {
  return knex.schema
    .dropTable("email_event")
    .dropTable("petition_reminder")
    .dropTable("file_upload")
    .dropTable("petition_field_reply")
    .dropTable("petition_sendout")
    .dropTable("email_log")
    .dropTable("petition_field")
    .dropTable("petition")
    .dropTable("contact")
    .dropTable("user")
    .dropTable("organization")
    .raw("DROP TYPE petition_reminder_status")
    .raw("DROP TYPE petition_reminder_type")
    .raw("DROP TYPE petition_sendout_status")
    .raw("DROP TYPE petition_status")
    .raw("DROP TYPE petition_field_type")
    .raw("DROP TYPE user_organization_role")
    .raw("DROP TYPE organization_status");
}
