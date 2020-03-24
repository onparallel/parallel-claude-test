import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex) {
  return knex.schema

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
      `create unique index "contact_owner_id_email_unique" on "contact" ("owner_id", "email") where "deleted_at" is null`
    )

    .createTable("petition", (t) => {
      t.increments("id");
      t.integer("org_id").notNullable();
      t.integer("owner_id").notNullable();
      t.string("name", 255).notNullable();
      t.string("custom_ref", 255);
      t.string("locale", 10).notNullable();
      t.boolean("is_template").notNullable().defaultTo(false);
      t.enum("status", ["DRAFT", "SCHEDULED", "PENDING", "COMPLETED"], {
        useNative: true,
        enumName: "petition_status",
      });
      t.timestamp("deadline");
      t.string("email_subject");
      t.string("email_body");
      timestamps(t);

      t.foreign("org_id").references("organization.id");
      t.foreign("owner_id").references("user.id");
    })
    .raw(
      `alter table "petition" add constraint "petition_is_template_status" check (
        (not "is_template" and "status" is not null) or ("is_template" and "status" is null)
      )`
    )

    .createTable("petition_field", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable();
      t.integer("position").notNullable();
      t.enum("type", ["FILE_UPLOAD"], {
        useNative: true,
        enumName: "petition_field_type",
      }).notNullable();
      t.string("title");
      t.string("description");
      t.boolean("optional").defaultTo(false).notNullable();
      t.json("options");
      t.boolean("validated").defaultTo(false).notNullable();
      timestamps(t);

      t.foreign("petition_id").references("petition.id");
    })
    .raw(
      `create unique index "petition_field_petition_id_position" on "petition_field" ("petition_id", "position") where "deleted_at" is null`
    )

    .createTable("petition_access", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable();
      t.integer("contact_id").notNullable();
      t.string("keycode").notNullable();
      timestamps(t);

      t.unique(["keycode"]);
      t.foreign("petition_id").references("petition.id");
    })

    .createTable("petition_field_reply", (t) => {
      t.increments("id");
      t.integer("petition_field_id").notNullable();
      t.integer("petition_access_id").notNullable();
      t.json("reply").notNullable();
      timestamps(t);

      t.foreign("petition_field_id").references("petition_field.id");
      t.foreign("petition_access_id").references("petition_access.id");
    })

    .createTable("petition_event_log", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable();
      t.integer("petition_access_id").notNullable();
      t.string("event");
      t.json("event_data");
      t.timestamp("event_date")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));

      t.foreign("petition_id").references("petition.id");
      t.foreign("petition_access_id").references("petition_access.id");
    });
}

export async function down(knex: Knex) {
  return knex.schema
    .dropTable("petition_event_log")
    .dropTable("petition_field_reply")
    .dropTable("petition_access")
    .dropTable("petition_field")
    .raw("DROP TYPE petition_field_type")
    .dropTable("petition")
    .raw("DROP TYPE petition_status")
    .dropTable("contact");
}
