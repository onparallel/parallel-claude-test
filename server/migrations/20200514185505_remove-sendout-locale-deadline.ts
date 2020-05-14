import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_sendout", (t) => {
    t.dropColumn("locale");
    t.dropColumn("deadline");
  });
}

export async function down(knex: Knex): Promise<any> {}
