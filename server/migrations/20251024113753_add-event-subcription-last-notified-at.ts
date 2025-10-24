import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_subscription", (table) => {
    table.timestamp("last_notified_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_subscription", (table) => {
    table.dropColumn("last_notified_at");
  });
}
