import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- useful for searching "safe to delete" field attachments files
    create index petition_field_attachment__file_upload_id
    on "petition_field_attachment" ("file_upload_id")
    where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index petition_field_attachment__file_upload_id;
  `);
}
