import { Knex } from "knex";

export async function addUserGroupType(knex: Knex, name: string) {
  // need to commit the transaction before safely using new enum value
  await knex.raw(/* sql */ `
    start transaction;
    alter type user_group_type add value '${name}';
    commit;
  `);
}

export async function removeUserGroupType(knex: Knex, name: string) {
  await knex.raw(/* sql */ `
    delete from user_group_permission
    where user_group_id in (select id from user_group where type = '${name}');

    delete from user_group_member
    where user_group_id in (select id from user_group where type = '${name}');

    delete from user_group where type = '${name}';
  `);

  const { rows } = await knex.raw<{
    rows: { type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::user_group_type)) as type
  `);

  await knex.raw(/* sql */ `
    alter type user_group_type rename to user_group_type_old;
    create type user_group_type as enum (${rows
      .map((r) => r.type)
      .filter((t) => t !== name)
      .map((t) => `'${t}'`)
      .join(",")});

    alter table user_group 
      alter column "type" drop default,
      alter column "type" type user_group_type using "type"::varchar::user_group_type,
      alter column "type" set default 'NORMAL'::user_group_type;

    drop type user_group_type_old;
  `);
}
