import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.text("title").alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.string("title").alter();
  });
}
