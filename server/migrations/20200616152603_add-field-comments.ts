import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  await knex.schema
    .createTable("petition_field_comment", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.integer("petition_field_id")
        .notNullable()
        .references("petition_field.id");
      t.integer("petition_field_reply_id").references(
        "petition_field_reply.id"
      );
      t.text("content").notNullable();
      t.integer("user_id").references("user.id");
      t.integer("contact_id").references("contact.id");
      t.timestamp("published_at");
      timestamps(t);
    })
    .raw(
      /* sql */ `
      create index "pfc__petition_id__petition_field_id" on petition_field_comment (
        petition_id,
        petition_field_id
      )
    `
    )

    .alterTable("petition_field_reply", (t) => {
      t.enum("status", ["PENDING", "REJECTED", "APPROVED"], {
        useNative: true,
        enumName: "petition_field_reply_status",
      })
        .notNullable()
        .defaultTo("PENDING");
    })

    .createTable("petition_user_notification", (t) => {
      t.increments("id");
      t.integer("user_id").notNullable().references("user.id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.enum("type", ["COMMENT_CREATED"], {
        useNative: true,
        enumName: "petition_user_notification_type",
      }).notNullable();
      t.jsonb("data");
      t.boolean("is_read").notNullable().defaultTo(false);
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    })

    .createTable("petition_contact_notification", (t) => {
      t.increments("id");
      t.integer("contact_id").notNullable().references("contact.id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.enum("type", ["COMMENT_CREATED"], {
        useNative: true,
        enumName: "petition_contact_notification_type",
      }).notNullable();
      t.jsonb("data");
      t.boolean("is_read").notNullable().defaultTo(false);
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    }).raw(/* sql */ `
      create index "pun__comment_created__petition_id__data" on petition_user_notification (
        petition_id,
        ((data ->> 'petition_field_id')::int),
        ((data ->> 'petition_field_comment_id')::int)
      ) where type = 'COMMENT_CREATED';
      create unique index "pun__comment_created__user_id__petition_id__data" on petition_user_notification (
        user_id,
        petition_id,
        ((data ->> 'petition_field_id')::int),
        ((data ->> 'petition_field_comment_id')::int)
      ) where type = 'COMMENT_CREATED';

      create index "pcn__comment_created__petition_id__data" on petition_contact_notification (
        petition_id,
        ((data ->> 'petition_field_id')::int),
        ((data ->> 'petition_field_comment_id')::int)
      ) where type = 'COMMENT_CREATED';
      create unique index "pcn__comment_created__contact_id__petition_id__data" on petition_contact_notification (
        contact_id,
        petition_id,
        ((data ->> 'petition_field_id')::int),
        ((data ->> 'petition_field_comment_id')::int)
      ) where type = 'COMMENT_CREATED';
    `);
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema
    .dropTable("petition_contact_notification")
    .dropTable("petition_user_notification")
    .alterTable("petition_field_reply", (t) => {
      t.dropColumn("status");
    })
    .dropTable("petition_field_comment")
    .raw(/* sql */ `drop type petition_user_notification_type`)
    .raw(/* sql */ `drop type petition_contact_notification_type`)
    .raw(/* sql */ `drop type petition_field_reply_status`);
}
