import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("petition_signature", (t) => {
      t.increments("id");
      t.integer("petition_id").notNullable().references("petition.id");
      t.string("signer_email").notNullable();
      t.string("provider").notNullable();
      t.string("external_id");
      t.enum(
        "status",
        [
          "PROCESSING",
          "READY_TO_SIGN",
          "DECLINED",
          "EXPIRED",
          "CANCELED",
          "SIGNED",
        ],
        {
          useNative: true,
          enumName: "petition_signature_status",
        }
      )
        .notNullable()
        .defaultTo("PROCESSING");
      t.jsonb("data");
      t.timestamp("created_at")
        .notNullable()
        .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    })
    .raw(
      `create unique index "petition_signature_petition_id_signer_email" on "petition_signature" ("petition_id", "signer_email")`
    );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTable("petition_signature")
    .raw(/* sql */ `drop type petition_signature_status`);
}
