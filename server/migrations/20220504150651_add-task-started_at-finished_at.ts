import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.timestamp("started_at").nullable();
    t.timestamp("finished_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.dropColumns("started_at", "finished_at");
  });
}
