import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_subscription", (t) => {
    // convert varchar(255) to text to avoid max length constraint
    t.text("endpoint").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("event_subscription", (t) => {
    t.string("endpoint").notNullable().alter();
  });
}
