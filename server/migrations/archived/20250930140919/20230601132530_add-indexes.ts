import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- deletePetitionUserNotificationsByPetitionId
    create index petition_user_notification__petition_id__user_id 
      on "petition_user_notification" (petition_id, user_id);

    -- getClosedPetitionsToAnonymize
    create index petition__closed__anonymizer
      on petition (org_id)
      where deleted_at is null
        and anonymized_at is null
        and status = 'CLOSED'
        and closed_at is not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index petition_user_notification__petition_id__user_id;
    drop index petition__closed__anonymizer;
  `);
}
