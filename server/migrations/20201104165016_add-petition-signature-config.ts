import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("signature_config");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("signature_config");
  });
}
