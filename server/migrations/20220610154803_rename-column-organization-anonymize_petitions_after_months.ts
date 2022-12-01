import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.renameColumn("anonymize_petitions_after_days", "anonymize_petitions_after_months");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.renameColumn("anonymize_petitions_after_months", "anonymize_petitions_after_days");
  });
}
