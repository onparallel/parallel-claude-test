import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  // need to commit the transaction before safely using new enum value
  await knex.raw(/* sql */ `
    start transaction;
    alter type feature_flag_name add value 'INTERNAL_COMMENTS';
    commit;
`);

  await knex.from("feature_flag").insert({
    name: "INTERNAL_COMMENTS",
    default_value: false,
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.from("feature_flag").where("name", "INTERNAL_COMMENTS").delete();
  await knex
    .from("feature_flag_override")
    .where("feature_flag_name", "INTERNAL_COMMENTS")
    .delete();

  // drop foreign key to avoid errors on next queries
  await knex.schema.alterTable("feature_flag_override", (t) => {
    t.dropForeign(["feature_flag_name"]);
  });

  // recreate feature_flag_name enum without INTERNAL_COMMENTS
  await knex.raw(/* sql */ `
    alter type feature_flag_name rename to feature_flag_name_old;
    create type feature_flag_name as enum ('PETITION_SIGNATURE');
    alter table feature_flag alter column "name" type feature_flag_name using "name"::varchar::feature_flag_name;
    alter table feature_flag_override alter column "feature_flag_name" type feature_flag_name using "feature_flag_name"::varchar::feature_flag_name;
    drop type feature_flag_name_old;
  `);

  await knex.schema.alterTable("feature_flag_override", (t) => {
    t.foreign("feature_flag_name").references("feature_flag.name");
  });
}
