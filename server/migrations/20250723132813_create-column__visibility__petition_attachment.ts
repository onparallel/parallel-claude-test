import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_attachment", (t) => {
    t.jsonb("visibility").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_attachment", (t) => {
    t.dropColumn("visibility");
  });
}
