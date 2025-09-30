import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.boolean("require_approval").notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("require_approval");
  });
}
