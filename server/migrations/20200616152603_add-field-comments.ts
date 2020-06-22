import * as Knex from "knex";

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
      t.boolean("is_published").notNullable().defaultTo(false);
    })

    .alterTable("petition_field_reply", (t) => {
      t.enum("status", ["PENDING", "REJECTED", "APPROVED"], {
        useNative: true,
        enumName: "petition_field_reply_status",
      })
        .notNullable()
        .defaultTo("PENDING");
    })

    .createTable("petition_notification", (t) => {
      t.increments("id");
      t.integer("user_id").notNullable().references("user.id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.enum(
        "type",
        ["REPLY_CREATED", "COMMENT_CREATED", "PETITION_COMPLETED"],
        {
          useNative: true,
          enumName: "petition_notification_type",
        }
      ).notNullable();
      t.jsonb("data");
      t.boolean("is_read").notNullable().defaultTo(false);
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    }).raw(/* sql */ `
      create index "pn__reply_created__petition_id__petition_reply_id" on petition_notification (
        petition_id,
        ((data ->> 'petition_reply_id')::int)
      ) where type = 'REPLY_CREATED'
    `).raw(/* sql */ `
      create index "pn__comment_created__petition_id__petition_field_id" on petition_notification (
        petition_id,
        ((data ->> 'petition_field_id')::int)
      ) where type = 'COMMENT_CREATED'
    `).raw(/* sql */ `
      create index "pn__petition_id__type" on petition_notification (
        petition_id,
        type
      )
    `);
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema
    .dropTable("petition_notification")
    .alterTable("petition_field_reply", (t) => {
      t.dropColumn("status");
    })
    .dropTable("petition_field_comment")
    .raw(/* sql */ `drop type petition_notification_type`)
    .raw(/* sql */ `drop type petition_field_reply_status`);
}
