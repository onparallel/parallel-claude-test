import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("organization", (t) => {
      t.jsonb("appsumo_license").nullable().defaultTo(null).alter();
    })
    .raw(
      /* sql */ `update "organization" set "appsumo_license" = NULL where "appsumo_license"->>'uuid' is null`
    );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `update "organization" set "appsumo_license" = '{}'::jsonb where "appsumo_license" is null`
  );
  await knex.schema.alterTable("organization", (t) => {
    t.jsonb("appsumo_license").notNullable().defaultTo(knex.raw("'{}'::json")).alter();
  });
}
