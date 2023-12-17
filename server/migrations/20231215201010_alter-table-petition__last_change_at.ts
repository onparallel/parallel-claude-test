import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition set last_change_at = updated_at where last_change_at is null;
  `);

  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("last_change_at").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP")).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("last_change_at").nullable().defaultTo(null).alter();
  });
}
