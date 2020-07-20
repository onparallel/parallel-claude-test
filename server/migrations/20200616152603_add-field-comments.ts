import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.createTable("petition_field_comment", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.integer("petition_field_id")
      .notNullable()
      .references("petition_field.id");
    t.integer("petition_field_reply_id").references("petition_field_reply.id");
    t.text("content").notNullable();
    t.integer("user_id").references("user.id");
    t.integer("petition_access_id").references("petition_access.id");
    t.timestamp("published_at");
    timestamps(t);
  });

  await knex.raw(/* sql */ `
      create index "pfc__petition_id__petition_field_id" on petition_field_comment (
        petition_id,
        petition_field_id
      )
    `);

  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.enum("status", ["PENDING", "REJECTED", "APPROVED"], {
      useNative: true,
      enumName: "petition_field_reply_status",
    })
      .notNullable()
      .defaultTo("PENDING");
  });

  await knex.schema.createTable("petition_user_notification", (t) => {
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
  });

  await knex.schema.createTable("petition_contact_notification", (t) => {
    t.increments("id");
    t.integer("petition_access_id")
      .notNullable()
      .references("petition_access.id");
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
  });

  await knex.raw(/* sql */ `
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
      create unique index "pcn__comment_created__petition_access_id__petition_id__data" on petition_contact_notification (
        petition_access_id,
        petition_id,
        ((data ->> 'petition_field_id')::int),
        ((data ->> 'petition_field_comment_id')::int)
      ) where type = 'COMMENT_CREATED';
    `);

  await knex.raw(/* sql */ `
    alter type petition_event_type add value 'COMMENT_PUBLISHED';
    alter type petition_event_type add value 'COMMENT_DELETED';
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

  await knex.raw(/* sql */ `
    delete from petition_event where "type" in ('COMMENT_PUBLISHED', 'COMMENT_DELETED');
    alter type petition_event_type rename to _petition_event_type;
    create type petition_event_type as enum (
      'PETITION_CREATED',
      'PETITION_COMPLETED',
      'ACCESS_ACTIVATED',
      'ACCESS_DEACTIVATED',
      'ACCESS_OPENED',
      'MESSAGE_SCHEDULED',
      'MESSAGE_CANCELLED',
      'MESSAGE_SENT',
      'REMINDER_SENT',
      'REPLY_CREATED',
      'REPLY_DELETED'
    );
    alter table petition_event alter column "type" type petition_event_type using "type"::text::petition_event_type;
    drop type _petition_event_type;
  `);
}
