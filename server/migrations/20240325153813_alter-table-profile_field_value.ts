import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- remove the check constraint
    alter table profile_field_value drop constraint profile_field_value__removed;

    -- make "created_by_user_id" nullable
    alter table profile_field_value alter column created_by_user_id drop not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    delete from profile_field_value where (removed_at is not null and removed_by_user_id is null) or created_by_user_id is null;

    alter table profile_field_value add constraint profile_field_value__removed
    check ((removed_at is null and removed_by_user_id is null) or (removed_at is not null and removed_by_user_id is not null));

    alter table profile_field_value alter column created_by_user_id set not null;
  `);
}
