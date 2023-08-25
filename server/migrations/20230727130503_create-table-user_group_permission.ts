import { Knex } from "knex";
import { sqlValues } from "./helpers/knex";
import { timestamps } from "./helpers/timestamps";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addUserGroupType, removeUserGroupType } from "./helpers/userGroupsTypes";

const PERMISSIONS = {
  SUPERADMIN: ["SUPERADMIN"],
  ADMIN: [
    "REPORTS:OVERVIEW",
    "REPORTS:TEMPLATE_STATISTICS",
    "REPORTS:TEMPLATE_REPLIES",
    "TAGS:CRUD_TAGS",
    "PROFILES:DELETE_PROFILES",
    "PROFILES:DELETE_PERMANENTLY_PROFILES",
    "PROFILE_TYPES:CRUD_PROFILE_TYPES",
    "INTEGRATIONS:CRUD_INTEGRATIONS",
    "USERS:CRUD_USERS",
    "USERS:GHOST_LOGIN",
    "TEAMS:CRUD_TEAMS",
    "TEAMS:CRUD_PERMISSIONS",
    "ORG_SETTINGS",
    "CONTACTS:DELETE_CONTACTS",
    "PETITIONS:SEND_ON_BEHALF",
  ],
  NORMAL: [
    "PETITIONS:CHANGE_PATH",
    "PETITIONS:CREATE_TEMPLATES",
    "INTEGRATIONS:CRUD_API",
    "PROFILES:SUBSCRIBE_PROFILES",
  ],
  COLLABORATOR: [
    "PETITIONS:CREATE_PETITIONS",
    "PROFILES:CREATE_PROFILES",
    "PROFILES:CLOSE_PROFILES",
    "PROFILES:LIST_PROFILES",
    "PROFILE_ALERTS:LIST_ALERTS",
    "CONTACTS:LIST_CONTACTS",
    "USERS:LIST_USERS",
    "TEAMS:LIST_TEAMS",
  ],
};

export async function up(knex: Knex): Promise<void> {
  await addUserGroupType(knex, "INITIAL");
  await addFeatureFlag(knex, "PERMISSION_MANAGEMENT", false);

  await knex.schema.createTable("user_group_permission", (t) => {
    t.increments("id");
    t.integer("user_group_id").notNullable().references("user_group.id");
    t.enum(
      "name",
      [
        ...PERMISSIONS.SUPERADMIN,
        ...PERMISSIONS.ADMIN,
        ...PERMISSIONS.NORMAL,
        ...PERMISSIONS.COLLABORATOR,
      ],
      {
        useNative: true,
        enumName: "user_group_permission_name",
      },
    ).notNullable();
    t.enum("effect", ["ALLOW", "DENY"], {
      useNative: true,
      enumName: "user_group_permission_effect",
    }).notNullable();
    timestamps(t);
  }).raw(/* sql */ `
      create index user_group_permission__user_group_id on user_group_permission (user_group_id) where deleted_at is null;
      create unique index user_group_permission__user_group_id__name on user_group_permission (user_group_id, name) where deleted_at is null;
    `);

  await knex.schema.alterTable("user", (t) => {
    t.boolean("is_org_owner").notNullable().defaultTo(false);
    t.specificType("organization_role", "user_organization_role").nullable().alter();
  }).raw(/* sql */ `
        update "user" set is_org_owner = ("organization_role" = 'OWNER')::boolean;

        comment on column "user"."organization_role" is '@deprecated';

        create unique index user__is_org_owner on "user" (org_id) where is_org_owner = true and deleted_at is null;
    `);

  // "ALL_USERS" user group permissions: ALLOW on everything except ADMIN permissions
  await knex.raw(
    /* sql */ `
    with permissions as (
      select * from (?) as t(permission_name)
    )
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select
      ug.id,
      p.permission_name,
      'ALLOW',
      ug.created_by,
      ug.updated_by
    from user_group ug cross join permissions p
    where ug.type = 'ALL_USERS'
    and ug.deleted_at is null;
  `,
    [
      knex.raw(
        ...sqlValues(
          [...PERMISSIONS.NORMAL, ...PERMISSIONS.COLLABORATOR].map((p) => [p]),
          ["user_group_permission_name"],
        ),
      ),
    ],
  );

  // create ADMIN groups
  await knex.raw(
    /* sql */ `
    with admin_user_group as (
      -- create groups
      insert into user_group (org_id, name, type)
      select
        org.id,
        'Admins',
        'INITIAL'::user_group_type
      from "organization" org where deleted_at is null
      returning *
    ),
    admin_permission as (
      select * from (?) as t(permission_name)
    ),
    admin_user_group_permission as (
      -- insert permissions
      insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
      select
        ug.id,
        p.permission_name,
        'ALLOW',
        ug.created_by,
        ug.updated_by
      from admin_user_group ug cross join admin_permission p
    )
    -- insert members
    insert into user_group_member (user_group_id, user_id)
    select
      ug.id,
      u.id
    from "user" u 
    join admin_user_group ug on ug.org_id = u.org_id
    where u.organization_role = 'ADMIN' and u.deleted_at is null;
  `,
    [
      knex.raw(
        ...sqlValues(
          [...PERMISSIONS.ADMIN, ...PERMISSIONS.NORMAL, ...PERMISSIONS.COLLABORATOR].map((p) => [
            p,
          ]),
          ["user_group_permission_name"],
        ),
      ),
    ],
  );

  // create COLLABORATOR groups
  await knex.raw(
    /* sql */ `
    with organizations_with_collaborators as (
      -- pick orgs with at least one COLLABORATOR
      select distinct u.org_id as id
      from "user" u
      where u.organization_role = 'COLLABORATOR' and u.status = 'ACTIVE' and u.deleted_at is null
    ),
    collaborator_user_group as (
      -- create groups
      insert into user_group (org_id, name, type)
      select
        o.id,
        'Collaborators',
        'INITIAL'::user_group_type
      from organizations_with_collaborators o
      returning *
    ),
    collaborator_permission as (
      select * from (?) as t(permission_name)
    ),
    collaborator_user_group_permission as (
      -- insert permissions
      insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
      select
        ug.id,
        p.permission_name,
        'DENY',
        ug.created_by,
        ug.updated_by
      from collaborator_user_group ug cross join collaborator_permission p
    )
    -- insert members
    insert into user_group_member (user_group_id, user_id)
    select
      ug.id,
      u.id
    from "user" u 
    join collaborator_user_group ug on ug.org_id = u.org_id
    where u.organization_role = 'COLLABORATOR' and u.status = 'ACTIVE' and u.deleted_at is null;
  `,
    [
      knex.raw(
        ...sqlValues(
          [...PERMISSIONS.ADMIN, ...PERMISSIONS.NORMAL].map((p) => [p]),
          ["user_group_permission_name"],
        ),
      ),
    ],
  );

  // create SUPERADMIN groups
  await knex.raw(
    /* sql */ `
    with organizations_with_superadmins as (
      -- pick just ROOT orgs
      select id from organization o where o.status = 'ROOT'
    ),
    superadmin_user_group as (
      -- insert groups
      insert into user_group (org_id, name, type)
      select
        o.id,
        'Superadmins',
        'INITIAL'::user_group_type
      from organizations_with_superadmins o
      returning *
    ),
    superadmin_permission as (
      select * from (?) as t(permission_name)
    ),
    superadmin_user_group_permission as (
      -- insert SUPERADMIN permissions
      insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
      select
        ug.id,
        p.permission_name,
        'ALLOW',
        ug.created_by,
        ug.updated_by
      from superadmin_user_group ug cross join superadmin_permission p
    )
    insert into user_group_member (user_group_id, user_id)
    select
      ug.id,
      u.id
    from "user" u 
    join superadmin_user_group ug on ug.org_id = u.org_id
    where u.organization_role in ('ADMIN', 'OWNER') and u.status = 'ACTIVE' and u.deleted_at is null;
  `,
    [
      knex.raw(
        ...sqlValues(
          [...PERMISSIONS.SUPERADMIN].map((p) => [p]),
          ["user_group_permission_name"],
        ),
      ),
    ],
  );
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PERMISSION_MANAGEMENT");
  await removeUserGroupType(knex, "INITIAL");
  await knex.schema.dropTable("user_group_permission");

  await knex.raw(/* sql */ `
    update "user" set organization_role = (
      case
        when is_org_owner = true then 'OWNER'::user_organization_role
        when organization_role = 'OWNER' then 'ADMIN'::user_organization_role
        else coalesce(organization_role, 'NORMAL'::user_organization_role)
      end
      )
  `);
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("is_org_owner");
    t.specificType("organization_role", "user_organization_role")
      .notNullable()
      .defaultTo("NORMAL")
      .alter();
  }).raw(/* sql */ `
        comment on column "user"."organization_role" is null;
        
        drop type "user_group_permission_name";
        drop type "user_group_permission_effect";
  `);
}
