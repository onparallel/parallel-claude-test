import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("organization", (t) => {
      t.jsonb("usage_details").nullable();
    })
    .createTable("organization_usage_limit", (t) => {
      t.increments("id");
      t.integer("org_id").notNullable().references("organization.id");
      t.enum("limit_name", ["PETITION_SEND"], {
        useNative: true,
        enumName: "organization_usage_limit_name",
      }).notNullable();
      t.integer("limit").notNullable();
      t.integer("used").notNullable().defaultTo(0);
      t.enum("period", ["month", "year"], {
        useNative: true,
        enumName: "organization_usage_limit_period",
      }).notNullable();
      t.timestamp("period_start_date").notNullable().defaultTo(knex.raw("CURRENT_TIMESTAMP"));
      t.timestamp("period_end_date").nullable();
    }).raw(/* sql */ `
        -- only one row of a limit per organization should have a null period_end_date
        create unique index "organization_usage_limit__org_id__limit_name__unique" 
        on "organization_usage_limit" (org_id, limit_name) where period_end_date is null;
    `);

  await knex
    .from("organization")
    .update(
      "usage_details",
      JSON.stringify({ USER_SEATS: 1000, PETITION_SEND: { limit: 5000, period: "month" } })
    );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("organization", (t) => {
      t.dropColumn("usage_details");
    })
    .dropTable("organization_usage_limit").raw(/* sql */ `
        drop type "organization_usage_limit_name";
        drop type "organization_usage_limit_period";
    `);
}
