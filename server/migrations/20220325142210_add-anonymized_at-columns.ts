import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_message", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_reminder", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("email_log", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("petition_message", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("petition_reminder", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("email_log", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumn("anonymized_at");
  });
}
