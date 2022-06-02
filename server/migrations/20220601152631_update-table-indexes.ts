import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "pun__unprocessed_comment_notifications";
    CREATE INDEX pun__unprocessed_notifications ON public.petition_user_notification USING btree (id) WHERE ((type = 'COMMENT_CREATED' or type = 'SIGNATURE_CANCELLED') AND is_read = false AND processed_at IS NULL);
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "pun__unprocessed_notifications";
    CREATE INDEX pun__unprocessed_comment_notifications ON public.petition_user_notification USING btree (id) WHERE type = 'COMMENT_CREATED' AND is_read = false AND processed_at IS NULL;
`);
}
