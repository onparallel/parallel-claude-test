import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.integer("from_template_id").references("petition.id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.dropColumn("from_template_id");
  });
}
