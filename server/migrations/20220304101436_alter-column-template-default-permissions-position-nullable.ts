import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("template_default_permission", (t) => {
    t.integer("position").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("template_default_permission", (t) => {
    t.integer("position").notNullable().defaultTo(0);
  });
}
