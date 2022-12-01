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

  await knex.raw(/* sql */ `
    create index license_code__appsumo_uuid__index on license_code ((details ->> 'uuid'::text)) where source = 'AppSumo';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("license_code");
  await knex.raw(`drop type "license_code_status"`);
}
