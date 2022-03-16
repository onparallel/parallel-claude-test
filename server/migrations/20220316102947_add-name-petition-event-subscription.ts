import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.string("name").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.dropColumn("name");
  });
}
