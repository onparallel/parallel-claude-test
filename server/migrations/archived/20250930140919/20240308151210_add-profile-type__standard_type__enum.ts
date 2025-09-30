import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_type", (t) => {
    t.enum("standard_type", ["INDIVIDUAL", "LEGAL_ENTITY", "CONTRACT"], {
      useNative: true,
      enumName: "profile_type_standard_type",
    })
      .nullable()
      .defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_type", (t) => {
    t.dropColumn("standard_type");
  });

  await knex.schema.raw("DROP TYPE profile_type_standard_type");
}
