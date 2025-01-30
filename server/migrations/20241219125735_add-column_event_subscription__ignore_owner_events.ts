import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_subscription", (t) => {
    t.boolean("ignore_owner_events").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_subscription", (t) => {
    t.dropColumn("ignore_owner_events");
  });
}
