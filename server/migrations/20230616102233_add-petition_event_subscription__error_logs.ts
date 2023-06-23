import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.jsonb("error_log").notNullable().defaultTo("[]");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.dropColumn("error_log");
  });
}
