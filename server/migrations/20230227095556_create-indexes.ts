import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- add "id" and "created_at" on INCLUDE for PetitionRepository@markOldPetitionUserNotificationsAsRead and loadUnreadPetitionUserNotificationsIdsByUserId
    create index _petition_user_notification__user_id__is_read on petition_user_notification (user_id) include (id, type, created_at) where (is_read = false);

    -- add "deleted_at" on INCLUDE for PetitionRepository@getDeletedPetitionIdsToAnonymize
    create index _petition__deleted_at__anonymized_at on petition (id) include (deleted_at) where deleted_at is not null and anonymized_at is null;
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index _petition_user_notification__user_id__is_read;
    drop index _petition__deleted_at__anonymized_at;
`);
}
