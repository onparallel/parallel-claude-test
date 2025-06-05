import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- there can only be one ADVERSE_MEDIA_SEARCH reply per petition field
    create unique index petition_field_reply__adverse_media__child_reply_unique on petition_field_reply (petition_field_id, parent_petition_field_reply_id) where type = 'ADVERSE_MEDIA_SEARCH' and parent_petition_field_reply_id is not null and deleted_at is null;
    create unique index petition_field_reply__adverse_media__reply_unique on petition_field_reply (petition_field_id) where type = 'ADVERSE_MEDIA_SEARCH' and parent_petition_field_reply_id is null and deleted_at is null;  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index if exists petition_field_reply__adverse_media__child_reply_unique;
    drop index if exists petition_field_reply__adverse_media__reply_unique;
  `);
}
