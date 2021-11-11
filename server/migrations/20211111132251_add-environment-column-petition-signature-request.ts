import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.enum("environment", ["DEMO", "PRODUCTION"], {
      useNative: true,
      enumName: "signature_environment",
    });
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema
    .alterTable("petition_signature_request", (t) => {
      t.dropColumn("environment");
    })
    .raw(/* sql */ `drop type signature_environment`);
}
