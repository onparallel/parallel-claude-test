import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.jsonb("visibility");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("visibility");
  });
}
