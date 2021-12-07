import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw("drop index public_petition_link__slug__unique");
  await knex.raw(
    'create unique index "public_petition_link__slug__unique" on "public_petition_link" ("slug")'
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("drop index public_petition_link__slug__unique");
  await knex.raw(
    'create unique index "public_petition_link__slug__unique" on "public_petition_link" ("slug") where is_active = true'
  );
}
