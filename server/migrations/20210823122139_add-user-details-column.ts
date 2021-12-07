import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.jsonb("details").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("details");
  });
}
