import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.boolean("comments_enabled").notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("comments_enabled");
  });
}
