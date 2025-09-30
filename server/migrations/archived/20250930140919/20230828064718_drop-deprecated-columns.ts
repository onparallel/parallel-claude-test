import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.dropColumn("finished_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.timestamp("finished_at").nullable();
  }).raw(/* sql */ `
    comment on column "task"."finished_at" is '@deprecated';
  `);
}
