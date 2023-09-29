import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index petition_user_notification__user_id__created_at__is_read
    on petition_user_notification (user_id, created_at desc)
    include ("type", "id") where (read_at is null);
    --include id too so loadUnreadPetitionUserNotificationsIdsByUserId can do an index only scan
    
    create index petition_user_notification__user_id__created_at
    on petition_user_notification (user_id, created_at desc)
    include ("type");
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition_user_notification__user_id__created_at__is_read";
    drop index "petition_user_notification__user_id__created_at";
  `);
}
