import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // delete all unpublished comments to avoid them being visible after the migration
  await knex
    .from("petition_field_comment")
    .where({ published_at: null, deleted_at: null })
    .update({ deleted_at: knex.raw("CURRENT_TIMESTAMP") });

  await knex.schema
    .alterTable("petition_user_notification", (t) => {
      t.timestamp("email_notification_sent_at");
    })
    .alterTable("petition_contact_notification", (t) => {
      t.timestamp("email_notification_sent_at");
    });

  // to avoid spamming emails when the new cronjob starts
  await knex.raw(/* sql */ `
    UPDATE petition_user_notification set email_notification_sent_at = "created_at";
  `);
  await knex.raw(/* sql */ `
    UPDATE petition_contact_notification set email_notification_sent_at = "created_at";
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("petition_field_comment", (t) => {
      t.timestamp("published_at");
    })
    .alterTable("petition_user_notification", (t) => {
      t.dropColumn("email_notification_sent_at");
    })
    .alterTable("petition_contact_notification", (t) => {
      t.dropColumn("email_notification_sent_at");
    });

  await knex.raw(/* sql */ `
    UPDATE petition_field_comment set published_at = "created_at" where published_at is null and deleted_at is null;
  `);
}
