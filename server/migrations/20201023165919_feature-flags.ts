import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("feature_flag", (t) => {
    t.increments("id");
    t.enum("name", ["PETITION_SIGNATURE"], {
      useNative: true,
      enumName: "feature_flag_name",
    })
      .unique()
      .notNullable();
    t.boolean("default_value").notNullable().defaultTo(false);
  });
  await knex.schema.createTable("feature_flag_override", (t) => {
    t.increments("id");
    t.specificType("feature_flag_name", "feature_flag_name")
      .notNullable()
      .references("feature_flag.name");
    t.integer("org_id").references("organization.id");
    t.integer("user_id").references("user.id");
    t.boolean("value").notNullable();
  });
  await knex.raw(/* sql */ `
    create unique index "feature_flag_override__org_id__feature_flag_name"
      on "feature_flag_override" ("org_id", "feature_flag_name") where "user_id" is null;
    create unique index "feature_flag_override__user_id__feature_flag_name"
      on "feature_flag_override" ("user_id", "feature_flag_name") where "org_id" is null;
    alter table feature_flag_override add constraint "feature_flag_override__org_id__user_id"
      check ((org_id is null and user_id is not null) or (org_id is not null and user_id is null));
    insert into feature_flag ("name", "default_value") values ('PETITION_SIGNATURE', false);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTable("feature_flag_override")
    .dropTable("feature_flag")
    .raw(/* sql */ `drop type feature_flag_name`);
}
