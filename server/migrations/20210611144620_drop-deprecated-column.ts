import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("published_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.timestamp("published_at");
  });
  await knex.raw(/* sql */ `
    UPDATE petition_field_comment set published_at = "created_at" where deleted_at is null;
  `);
}
