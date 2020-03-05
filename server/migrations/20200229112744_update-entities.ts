import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema
    .alterTable("petition", t => {
      t.string("name", 255)
        .nullable()
        .alter();
      t.text("email_body")
        .nullable()
        .alter();
    })
    .raw(`alter type "petition_field_type" add value 'TEXT'`);
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema
    .raw(`update "petition" set "name" = '' where "name" is null`)
    .alterTable("petition", t => {
      t.string("name", 255)
        .notNullable()
        .alter();
      t.string("email_body")
        .nullable()
        .alter();
    });
}
