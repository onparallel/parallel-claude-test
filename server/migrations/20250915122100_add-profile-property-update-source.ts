import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_field_value", (t) => {
    t.string("source").nullable();
  });

  await knex.raw(/* sql */ `
    update profile_field_value
    set source = 'EXTERNAL'
    where external_source_integration_id is not null;
  `);

  await knex.schema.alterTable("profile_field_file", (t) => {
    t.string("source").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_field_value", (t) => {
    t.dropColumn("source");
  });

  await knex.schema.alterTable("profile_field_file", (t) => {
    t.dropColumn("source");
  });
}
