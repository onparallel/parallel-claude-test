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
  }).raw(/* sql */ `
    alter table "petition_field_comment" add constraint "petition_field_comment__content__anonymized_at" 
    check (("content" = '' and "anonymized_at" is not null) or "anonymized_at" is null)
`);

  await knex.schema.alterTable("petition_message", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("petition_reminder", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });

  await knex.schema.alterTable("email_log", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  }).raw(/* sql */ `
  alter table "email_log" add constraint "email_log__text_html_to_subject__anonymized_at" check (
    ("text" = '' and "html" = '' and "to" = '' and "subject" = '' and "anonymized_at" is not null) 
    or "anonymized_at" is null)
`);

  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("petition_field_reply").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("petition_field_comment").whereNotNull("anonymized_at").delete();
  await knex.raw(
    /* sql */ `alter table "petition_field_comment" drop constraint "petition_field_comment__content__anonymized_at"`
  );
  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("petition_message").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("petition_message", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("petition_reminder").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("petition_reminder", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("email_log").whereNotNull("anonymized_at").delete();
  await knex.raw(
    /* sql */ `alter table "email_log" drop constraint "email_log__text_html_to_subject__anonymized_at"`
  );
  await knex.schema.alterTable("email_log", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.from("petition_signature_request").whereNotNull("anonymized_at").delete();
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumn("anonymized_at");
  });
}
