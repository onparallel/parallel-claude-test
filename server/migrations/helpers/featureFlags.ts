import { Knex } from "knex";

export async function addFeatureFlag(
  knex: Knex,
  featureFlag: string,
  defaultValue: boolean
) {
  // need to commit the transaction before safely using new enum value
  await knex.raw(/* sql */ `
    start transaction;
      alter type feature_flag_name add value '${featureFlag}';
    commit;
  `);

  await knex.from("feature_flag").insert({
    name: featureFlag,
    default_value: defaultValue,
  });
}

export async function removeFeatureFlag(knex: Knex, featureFlag: string) {
  await knex
    .from("feature_flag_override")
    .where("feature_flag_name", featureFlag)
    .delete();

  await knex.from("feature_flag").where("name", featureFlag).delete();

  // get existing feature flags
  const { rows } = await knex.raw<{
    rows: { feature_flag: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::feature_flag_name)) as feature_flag
  `);

  // drop foreign key to avoid errors on next queries
  await knex.schema.alterTable("feature_flag_override", (t) => {
    t.dropForeign(["feature_flag_name"]);
  });

  // recreate feature_flag_name enum without this feature flag
  await knex.raw(/* sql */ `
    alter type feature_flag_name rename to feature_flag_name_old;
    create type feature_flag_name as enum (${rows
      .map((r) => r.feature_flag)
      .filter((f) => f !== featureFlag)
      .map((f) => `'${f}'`)
      .join(",")});
    alter table feature_flag alter column "name" type feature_flag_name using "name"::varchar::feature_flag_name;
    alter table feature_flag_override alter column "feature_flag_name" type feature_flag_name using "feature_flag_name"::varchar::feature_flag_name;
    drop type feature_flag_name_old;
  `);

  await knex.schema.alterTable("feature_flag_override", (t) => {
    t.foreign("feature_flag_name").references("feature_flag.name");
  });
}
