import { Knex } from "knex";
import { addUserGroupPermission, removeUserGroupPermission } from "./helpers/userGroupPermission";

export async function up(knex: Knex): Promise<void> {
  await addUserGroupPermission(knex, "TEAMS:READ_PERMISSIONS");
  await addUserGroupPermission(knex, "TEAMS:UPDATE_PERMISSIONS");

  await knex.raw(/* sql */ `
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select 
      ugp.user_group_id,
      'TEAMS:READ_PERMISSIONS',
      ugp.effect, 
      ugp.created_by,
      ugp.updated_by
    from user_group_permission ugp
    where ugp.name = 'TEAMS:LIST_TEAMS'
    and ugp.deleted_at is null;
  `);
  await knex.raw(/* sql */ `
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select 
      ugp.user_group_id,
      'TEAMS:UPDATE_PERMISSIONS',
      ugp.effect, 
      ugp.created_by,
      ugp.updated_by
    from user_group_permission ugp
    where ugp.name = 'TEAMS:CRUD_PERMISSIONS'
    and ugp.deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await removeUserGroupPermission(knex, "TEAMS:READ_PERMISSIONS");
  await removeUserGroupPermission(knex, "TEAMS:UPDATE_PERMISSIONS");
}
