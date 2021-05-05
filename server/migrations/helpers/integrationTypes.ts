import { Knex } from "knex";

export async function addIntegrationType(knex: Knex, type: string) {
  await knex.schema.raw(/* sql */ `
    alter type integration_type add value '${type}';
  `);
}

export async function removeIntegrationType(knex: Knex, type: string) {
  await knex.from("org_integration").where("type", type).delete();

  const { rows } = await knex.raw<{
    rows: { type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::integration_type)) as "type"
  `);

  await knex.raw(/* sql */ `
    alter type integration_type rename to integration_type_old;
    create type integration_type as enum (${rows
      .map((r) => r.type)
      .filter((f) => f !== type)
      .map((f) => `'${f}'`)
      .join(",")});
    alter table org_integration alter column "type" type integration_type using "type"::varchar::integration_type;
    drop type integration_type_old;
  `);
}
