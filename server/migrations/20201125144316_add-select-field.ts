import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`alter type "petition_field_type" add value 'SELECT'`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.from("petition_field_reply").where("type", "SELECT").delete();
  await knex.from("petition_field").where("type", "SELECT").delete();
  await knex.raw(/* sql */ `
    alter type petition_field_type rename to petition_field_type_old;
    create type petition_field_type as enum ('TEXT', 'FILE_UPLOAD', 'HEADING');
    alter table petition_field alter column "type" type petition_field_type using "type"::varchar::petition_field_type;
    alter table petition_field_reply alter column "type" type petition_field_type using "type"::varchar::petition_field_type;
    drop type petition_field_type_old;
  `);
}
