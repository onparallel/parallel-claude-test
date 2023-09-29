import { Knex } from "knex";
import { addUserGroupPermission, removeUserGroupPermission } from "./helpers/userGroupPermission";

export async function up(knex: Knex): Promise<void> {
  await addUserGroupPermission(knex, "TAGS:CREATE_TAGS");
  await addUserGroupPermission(knex, "TAGS:UPDATE_TAGS");
  await addUserGroupPermission(knex, "TAGS:DELETE_TAGS");

  await knex.raw(/* sql */ `
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select 
      ug.id,
      'TAGS:CREATE_TAGS',
      'GRANT',
      ug.created_by,
      ug.updated_by
    from user_group ug
    where ug.type = 'ALL_USERS'
    and ug.deleted_at is null;
  `);
  await knex.raw(/* sql */ `
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select 
      ugp.user_group_id,
      'TAGS:UPDATE_TAGS',
      ugp.effect, 
      ugp.created_by,
      ugp.updated_by
    from user_group_permission ugp
    where ugp.name = 'TAGS:CRUD_TAGS'
    and ugp.deleted_at is null;
  `);
  await knex.raw(/* sql */ `
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select 
      ugp.user_group_id,
      'TAGS:DELETE_TAGS',
      ugp.effect, 
      ugp.created_by,
      ugp.updated_by
    from user_group_permission ugp
    where ugp.name = 'TAGS:CRUD_TAGS'
    and ugp.deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await removeUserGroupPermission(knex, "TAGS:CREATE_TAGS");
  await removeUserGroupPermission(knex, "TAGS:UPDATE_TAGS");
  await removeUserGroupPermission(knex, "TAGS:DELETE_TAGS");
}
