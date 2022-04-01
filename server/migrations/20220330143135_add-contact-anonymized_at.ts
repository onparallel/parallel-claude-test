import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact", (t) => {
    t.dropColumn("anonymized_at");
  });
}
