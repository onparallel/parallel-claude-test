import type { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("standard_list_definition", (t) => {
    t.increments("id");
    t.jsonb("title").notNullable().defaultTo(knex.raw(/* sql */ `jsonb_build_object('en', '')`));
    t.string("list_name").notNullable(); // Used to identify the list in any of its version e.g. BASEL_INDEX_LESS_THAN_5, GAFI_BLACKLIST, SANCTIONED_COUNTRIES
    t.date("list_version").notNullable();
    t.jsonb("version_format").notNullable().defaultTo("{}");
    t.enum("list_type", ["COUNTRIES"], {
      useNative: true,
      enumName: "standard_list_definition_list_type",
    }).notNullable();
    t.jsonb("values").notNullable().defaultTo("[]");
    t.string("source_name").notNullable();
    t.string("source_url").nullable();
    t.string("version_url").nullable();
    timestamps(t, { deleted: false });
  });

  await knex.raw(/* sql */ `
    -- all "list_name" must be in UPPER_SNAKE_CASE, as it's used as an internal identifier
    alter table standard_list_definition
    add constraint standard_list_definition__list_name__upper_snake_case
    check (list_name ~ '^[A-Z0-9_]+$');

    create unique index standard_list_definition__list_name__list_version__unique
    on standard_list_definition (list_name, list_version);
  `);

  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("standard_list_definition_override").notNullable().defaultTo("[]");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("standard_list_definition_override");
  });

  await knex.schema.dropTable("standard_list_definition");

  await knex.raw(/* sql */ `
    drop type standard_list_definition_list_type;
  `);
}
