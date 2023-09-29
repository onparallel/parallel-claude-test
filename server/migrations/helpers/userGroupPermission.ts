import { Knex } from "knex";

export async function addUserGroupPermission(knex: Knex, userGroupPermission: string) {
  // need to commit the transaction before safely using new enum value
  await knex.raw(/* sql */ `
    start transaction;
      alter type user_group_permission_name add value '${userGroupPermission}';
    commit;
  `);
}

export async function removeUserGroupPermission(knex: Knex, userGroupPermission: string) {
  await knex.from("user_group_permission").where("name", userGroupPermission).delete();

  // get existing permission names
  const { rows } = await knex.raw<{
    rows: { user_group_permission: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::user_group_permission_name)) as user_group_permission 
  `);

  // recreate user_group_permission_name enum without this feature flag
  await knex.raw(/* sql */ `
    alter type user_group_permission_name rename to user_group_permission_name_old;
    create type user_group_permission_name as enum (${rows
      .map((r) => r.user_group_permission)
      .filter((f) => f !== userGroupPermission)
      .map((f) => `'${f}'`)
      .join(",")});
    alter table user_group_permission alter column "name" type user_group_permission_name using "name"::varchar::user_group_permission_name;
    drop type user_group_permission_name_old;
  `);
}
