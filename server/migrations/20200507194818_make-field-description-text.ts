import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_field", (t) => {
    t.text("description").alter();
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_field", (t) => {
    t.string("description").alter();
  });
}
