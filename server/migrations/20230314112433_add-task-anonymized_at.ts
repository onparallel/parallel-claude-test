import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.raw(/* sql */ `
    create index task__anonymized_at on "task" ("id") include ("created_at") where anonymized_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index task__anonymized_at;
  `);

  await knex.schema.alterTable("task", (t) => {
    t.dropColumn("anonymized_at");
  });
}
