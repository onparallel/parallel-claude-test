import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.timestamp("processed_at").nullable().defaultTo(null);
    t.string("processed_by");
  }).raw(/* sql */ `
    comment on column task.finished_at is '@deprecated';
  `);

  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.timestamp("processed_at").nullable().defaultTo(null);
    t.string("processed_by");
  });

  await knex.schema.alterTable("petition_event", (t) => {
    t.string("processed_by");
  });

  await knex.schema.alterTable("system_event", (t) => {
    t.string("processed_by");
  });

  await knex.schema.alterTable("email_log", (t) => {
    t.timestamp("processed_at").nullable().defaultTo(null);
    t.string("processed_by");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.dropColumns("processed_at", "processed_by");
  }).raw(/* sql */ `
    comment on column task.finished_at is null;
  `);

  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumns("processed_at", "processed_by");
  });

  await knex.schema.alterTable("petition_event", (t) => {
    t.dropColumn("processed_by");
  });

  await knex.schema.alterTable("system_event", (t) => {
    t.dropColumn("processed_by");
  });

  await knex.schema.alterTable("email_log", (t) => {
    t.dropColumns("processed_at", "processed_by");
  });
}
