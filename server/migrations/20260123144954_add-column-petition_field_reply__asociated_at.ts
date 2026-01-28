import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.timestamp("associated_at").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("associated_at");
  });
}
