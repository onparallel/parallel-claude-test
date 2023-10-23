import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.integer("parent_petition_field_reply_id").nullable().references("petition_field_reply.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("parent_petition_field_reply_id");
  });
}
