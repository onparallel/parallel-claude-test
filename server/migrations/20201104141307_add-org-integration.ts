import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("org_integration", (t) => {
    t.increments("id");
    t.integer("org_id").references("organization.id");
    t.enum("type", ["SIGNATURE"], {
      useNative: true,
      enumName: "integration_type",
    }).notNullable();
    t.string("provider").notNullable();
    t.jsonb("settings");
    t.boolean("is_enabled").notNullable().defaultTo(false);

    t.unique(
      ["org_id", "type", "provider"],
      "org_integration__org_id__type__provider"
    );
  }).raw(/* sql */ `
      alter table org_integration 
      add constraint org_integration__provider_uppercase_check
      check (upper("provider") = "provider")
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTable("org_integration")
    .raw(/* sql */ `drop type integration_type`);
}
