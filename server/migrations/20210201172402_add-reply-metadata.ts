import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.jsonb("metadata").notNullable().defaultTo(knex.raw("'{}'::json"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("metadata");
  });
}
