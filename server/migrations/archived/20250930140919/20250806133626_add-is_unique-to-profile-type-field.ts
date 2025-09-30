import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_type_field", (table) => {
    table.boolean("is_unique").notNullable().defaultTo(false);
  });
  await knex.schema.alterTable("profile_field_value", (table) => {
    table.boolean("profile_type_field_is_unique").notNullable().defaultTo(false);
  });
  await knex.raw(/* sql */ `
    create unique index profile_field_value__unique_values_uniq on profile_field_value (profile_type_field_id, (content->>'value'))
    where profile_type_field_is_unique and removed_at is null and deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index profile_field_value__unique_values_uniq;
  `);
  await knex.schema.alterTable("profile_field_value", (table) => {
    table.dropColumn("profile_type_field_is_unique");
  });
  await knex.schema.alterTable("profile_type_field", (table) => {
    table.dropColumn("is_unique");
  });
}
