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

  await knex.schema.alterTable("contact", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("file_upload", (t) => {
    t.timestamp("file_deleted_at").nullable().defaultTo(null);
  });

  await knex.raw(/* sql */ `
    -- indexes used by anonymizer cron to fetch deleted entries to anonymize
    create index "petition__deleted_at__anonymized_at" on petition (id) where deleted_at is not null and anonymized_at is null;
    create index "petition_field_reply__deleted_at__anonymized_at" on petition_field_reply (id) where deleted_at is not null and anonymized_at is null;
    create index "petition_field_comment__deleted_at__anonymized_at" on petition_field_comment (id) where deleted_at is not null and anonymized_at is null;
    create index "contact__deleted_at__anonymized_at" on contact (id) where deleted_at is not null and anonymized_at is null;
    create index "file_upload__deleted_at_notnull__file_deleted_at_null" on file_upload ("path") where deleted_at is not null and file_deleted_at is null;
    create index "file_upload__deleted_at_null__file_deleted_at_null" on file_upload ("path") where deleted_at is null and file_deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition__deleted_at__anonymized_at";
    drop index "petition_field_reply__deleted_at__anonymized_at";
    drop index "petition_field_comment__deleted_at__anonymized_at";
    drop index "contact__deleted_at__anonymized_at";
    drop index "file_upload__deleted_at_notnull__file_deleted_at_null";
    drop index "file_upload__deleted_at_null__file_deleted_at_null";
  `);

  await knex.schema.alterTable("contact", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("file_upload", (t) => {
    t.dropColumn("file_deleted_at");
  });

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
