import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_field_value", (t) => {
    t.integer("petition_field_reply_id")
      .references("petition_field_reply.id")
      .nullable()
      .defaultTo(null);
  });

  await knex.schema.alterTable("profile_field_file", (t) => {
    t.integer("petition_field_reply_id")
      .references("petition_field_reply.id")
      .nullable()
      .defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_field_value", (t) => {
    t.dropColumn("petition_field_reply_id");
  });

  await knex.schema.alterTable("profile_field_file", (t) => {
    t.dropColumn("petition_field_reply_id");
  });
}
