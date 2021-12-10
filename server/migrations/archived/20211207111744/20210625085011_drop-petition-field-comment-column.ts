import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("petition_field_reply_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.integer("petition_field_reply_id").references("petition_field_reply.id");
  });
}
