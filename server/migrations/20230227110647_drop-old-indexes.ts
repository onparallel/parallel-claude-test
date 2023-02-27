import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index petition_user_notification__user_id__is_read;
    alter index _petition_user_notification__user_id__is_read rename to petition_user_notification__user_id__is_read;

    drop index petition__deleted_at__anonymized_at;
    alter index _petition__deleted_at__anonymized_at rename to petition__deleted_at__anonymized_at;
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter index petition_user_notification__user_id__is_read rename to _petition_user_notification__user_id__is_read;
    alter index petition__deleted_at__anonymized_at rename to _petition__deleted_at__anonymized_at;

    create index petition_user_notification__user_id__is_read on petition_user_notification (user_id) include (type) where (is_read = false);
    create index petition__deleted_at__anonymized_at on petition (id) where deleted_at is not null and anonymized_at is null;
`);
}
