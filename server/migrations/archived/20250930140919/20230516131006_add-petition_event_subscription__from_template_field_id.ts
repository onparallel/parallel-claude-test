import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.specificType("from_template_field_ids", "int[]");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.dropColumn("from_template_field_ids");
  });
}
