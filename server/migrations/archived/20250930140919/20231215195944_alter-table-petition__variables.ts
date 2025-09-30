import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition set variables = '[]' where variables is null;
  `);

  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("variables").notNullable().defaultTo("[]").alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("variables").nullable().defaultTo(null).alter();
  });
}

export const config = {
  transaction: false,
};
