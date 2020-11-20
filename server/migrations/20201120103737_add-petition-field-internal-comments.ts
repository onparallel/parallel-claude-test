import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.boolean("is_internal").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("is_internal");
  });
}
