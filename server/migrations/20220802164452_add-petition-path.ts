import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.text("path").notNullable().defaultTo("/");
  });
  await knex.raw(/* sql */ `
    alter table "petition" add constraint "petition__path" check (
      char_length("path") < 1000 and ("path" = '/' or "path" like '/%/')
    )`);
  await knex.raw(/* sql */ `
    create or replace function get_folder_after_prefix(path text, prefix text)
      returns text language plpgsql as $$
    declare
      without_prefix text;
    begin
      without_prefix := substring(path, char_length(prefix) + 1);
      return case
        when without_prefix = '' then null
        else split_part(without_prefix, '/', 1)
      end;
    end;
    $$
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop function get_folder_after_prefix;
  `);
  await knex.raw(/* sql */ `alter table "petition" drop constraint "petition__path"`);
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("path");
  });
}
