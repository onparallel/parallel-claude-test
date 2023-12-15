import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("ai_completion_log", (t) => {
    t.integer("request_duration_ms").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("ai_completion_log", (t) => {
    t.dropColumn("request_duration_ms");
  });
}
