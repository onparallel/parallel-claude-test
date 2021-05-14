import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // delete all unpublished comments to avoid them being visible after the migration
  await knex
    .from("petition_field_comment")
    .where({ published_at: null, deleted_at: null })
    .update({ deleted_at: knex.raw("CURRENT_TIMESTAMP") });

  await knex.schema
    .alterTable("petition_user_notification", (t) => {
      t.timestamp("processed_at");
    })
    .alterTable("petition_contact_notification", (t) => {
      t.timestamp("processed_at");
    });

  // to avoid spamming emails when the new cronjob starts
  await knex.raw(/* sql */ `
    UPDATE petition_user_notification set processed_at = "created_at";
  `);
  await knex.raw(/* sql */ `
    UPDATE petition_contact_notification set processed_at = "created_at";
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("petition_user_notification", (t) => {
      t.dropColumn("processed_at");
    })
    .alterTable("petition_contact_notification", (t) => {
      t.dropColumn("processed_at");
    });
}
