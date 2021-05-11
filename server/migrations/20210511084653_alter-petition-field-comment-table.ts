import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.renameColumn("published_at", "notified_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.renameColumn("notified_at", "published_at");
  });
}
