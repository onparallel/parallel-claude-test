import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  /* 
    search for members of ALL_USERS groups that have been deleted and that user is currently ACTIVE, and restore them
    */
  await knex.raw(/* sql */ `
    update user_group_member 
    set 
        deleted_at = null,
        deleted_by = null
    from user_group_member ugm 
        join user_group ug on ug.id = ugm.user_group_id
        join "user" u on u.id = ugm.user_id 
    where 
        ug.type = 'ALL_USERS'
        and ug.deleted_at is null
        and ugm.deleted_at is not null
        and u.deleted_at is null
        and u.status = 'ACTIVE';
    `);
}

export async function down(knex: Knex): Promise<void> {}
