import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.jsonb("signer_status").notNullable().defaultTo(knex.raw("'{}'::json"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumn("signer_status");
  });
}
