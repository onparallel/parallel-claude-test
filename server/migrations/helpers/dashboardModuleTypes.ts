import { Knex } from "knex";

export async function addModuleType(knex: Knex, name: string) {
  await knex.schema.raw(/* sql */ `
    alter type dashboard_module_type add value '${name}';
  `);
}

export async function removeModuleType(knex: Knex, name: string) {
  await knex.from("dashboard_module").where("type", name).delete();

  const { rows } = await knex.raw<{
    rows: { module_type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::dashboard_module_type)) as module_type
  `);

  await knex.raw(/* sql */ `
    alter type dashboard_module_type rename to dashboard_module_type_old;
    create type dashboard_module_type as enum (${rows
      .map((r) => r.module_type)
      .filter((f) => f !== name)
      .map((f) => `'${f}'`)
      .join(",")});
    alter table dashboard_module alter column "type" type dashboard_module_type using "type"::varchar::dashboard_module_type;
    drop type dashboard_module_type_old;
  `);
}
