import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("license_code", (t) => {
    t.increments("id");
    t.string("source").notNullable();
    t.string("code").notNullable();
    t.jsonb("details").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
    t.enum("status", ["PENDING", "REDEEMED", "EXPIRED"], {
      useNative: true,
      enumName: "license_code_status",
    })
      .notNullable()
      .defaultTo("PENDING");
    timestamps(t, { deleted: false });

    t.unique(["code"], { indexName: "license_code__code_unique" });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("license_code");
  await knex.raw(`drop type "license_code_status"`);
}
