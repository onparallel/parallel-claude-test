import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_field_reply", (t) => {
    t.renameColumn("reply", "content");
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_field_reply", (t) => {
    t.renameColumn("content", "reply");
  });
}
