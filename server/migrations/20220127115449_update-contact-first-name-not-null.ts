import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact", (t) => {
    t.string("first_name").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact", (t) => {
    t.string("first_name").nullable().alter();
  });
}
