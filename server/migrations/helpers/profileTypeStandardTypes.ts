import { Knex } from "knex";

export async function addProfileTypeStandardType(knex: Knex, standardType: string) {
  await knex.schema.raw(/* sql */ `
    alter type profile_type_standard_type add value '${standardType}';
  `);
}

export async function removeProfileTypeStandardType(knex: Knex, standardType: string) {
  await knex
    .from("profile_type")
    .where("standard_type", standardType)
    .update({ standard_type: null });

  await knex.from("profile_external_source_entity").where("standard_type", standardType).delete();

  const { rows } = await knex.raw<{
    rows: { profile_type_standard_type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::profile_type_standard_type)) as profile_type_standard_type
  `);

  await knex.raw(/* sql */ `
    alter type profile_type_standard_type rename to profile_type_standard_type_old;
    create type profile_type_standard_type as enum (${rows
      .map((r) => r.profile_type_standard_type)
      .filter((f) => f !== standardType)
      .map((f) => `'${f}'`)
      .join(",")});

    alter table profile_type alter column "standard_type" type profile_type_standard_type using "standard_type"::varchar::profile_type_standard_type;
    alter table profile_external_source_entity alter column "standard_type" type profile_type_standard_type using "standard_type"::varchar::profile_type_standard_type;
    drop type profile_type_standard_type_old;
  `);
}
