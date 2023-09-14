import { Knex } from "knex";
import { sqlValues } from "./helpers/knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `
    with orgs as (
      select o.id, o.created_at, o.created_by from organization o
      left join "user_group" ug on o.id = ug.org_id and ug.type = 'ALL_USERS' and ug.deleted_at is null
      where ug.id is null
    ), permissions as (
      select * from (?) as t(permission_name)
    ), groups as (
      -- create groups
      insert into user_group (org_id, name, localizable_name, type, created_at, created_by)
      select
        o.id,
        '',
        '{ "es": "Todos los usuarios", "en": "All users" }'::jsonb,
        'ALL_USERS'::user_group_type,
        o.created_at,
        o.created_by
      from orgs o
      returning *
    ), members as (
      insert into user_group_member (user_group_id, user_id, created_at, created_by)
      select
        ug.id,
        u.id,
        u.created_at,
        u.created_by
      from "user" u 
      join groups ug on ug.org_id = u.org_id
      where u.status = 'ACTIVE' and u.deleted_at is null
    )
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select
      ug.id,
      p.permission_name,
      'GRANT',
      ug.created_by,
      ug.updated_by
    from groups ug cross join permissions p
  `,
    [
      knex.raw(
        ...sqlValues(
          [
            "PETITIONS:CHANGE_PATH",
            "PETITIONS:CREATE_TEMPLATES",
            "INTEGRATIONS:CRUD_API",
            "PROFILES:SUBSCRIBE_PROFILES",
            "PETITIONS:CREATE_PETITIONS",
            "PROFILES:CREATE_PROFILES",
            "PROFILES:CLOSE_PROFILES",
            "PROFILES:LIST_PROFILES",
            "PROFILE_ALERTS:LIST_ALERTS",
            "CONTACTS:LIST_CONTACTS",
            "USERS:LIST_USERS",
            "TEAMS:LIST_TEAMS",
          ].map((p) => [p]),
          ["user_group_permission_name"],
        ),
      ),
    ],
  );
}

export async function down(knex: Knex): Promise<void> {}
