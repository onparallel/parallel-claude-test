import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition", (t) => {
    t.text("email_body").alter();
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition", (t) => {
    t.string("email_body").alter();
  });
}
