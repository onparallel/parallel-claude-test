import type { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";
import { addUserGroupPermission, removeUserGroupPermission } from "./helpers/userGroupPermission";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("dashboard_permission", (t) => {
    t.increments("id");
    t.integer("dashboard_id").notNullable().references("dashboard.id");
    t.integer("user_id").nullable().references("user.id");
    t.integer("user_group_id").nullable().references("user_group.id");
    t.enum("type", ["READ", "WRITE", "OWNER"], {
      useNative: true,
      enumName: "dashboard_permission_type",
    }).notNullable();
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- only 1 OWNER per dashboard
    create unique index "dashboard_permission__dashboard_id__owner" on "dashboard_permission" (dashboard_id) where type = 'OWNER' and deleted_at is null;

    -- a user_group cannot be OWNER
    alter table "dashboard_permission" add constraint "dashboard_permission__user_group__not_owner" check (
      (user_group_id is null) or (type != 'OWNER')
    );

    -- user_id and user_group_id do not repeat per dashboard
    create unique index "dashboard_permission__dashboard_id__user_id" on "dashboard_permission" (dashboard_id, user_id) where deleted_at is null;
    create unique index "dashboard_permission__dashboard_id__user_group_id" on "dashboard_permission" (dashboard_id, user_group_id) where deleted_at is null;

    -- ensure that a permission is either for a user or a user group
    alter table "dashboard_permission" add constraint "dashboard_permission__user_or_user_group" check (
      (user_id is not null and user_group_id is null) or (user_id is null and user_group_id is not null)
    );

    -- create OWNER permissions
    insert into "dashboard_permission" (dashboard_id, user_id, type, created_by, created_at)
    select 
      d.id,
      u.id,
      'OWNER',
      d.created_by,
      d.created_at
    from "dashboard" d 
    join "user" u on d.org_id = u.org_id and u.id = regexp_replace(d.created_by, '^[^:]*:', '')::int 
    where u.deleted_at is null
      and d.deleted_at is null;

    -- create WRITE permissions for ALL_USERS groups
    insert into "dashboard_permission" (dashboard_id, user_group_id, type, created_by, created_at)
    select 
      d.id,
      ug.id,
      'WRITE',
      d.created_by,
      d.created_at
    from "dashboard" d 
    join "user_group" ug on d.org_id = ug.org_id and ug.type = 'ALL_USERS'
    where ug.deleted_at is null
    and d.deleted_at is null;
  `);

  // add a "preferences" column on user table to store dashboard tab ordering
  await knex.schema.alterTable("user", (t) => {
    t.jsonb("preferences").notNullable().defaultTo("{}");
  });

  // these 2 columns are deprecated, make it nullable and drop them later
  await knex.schema.alterTable("dashboard", (t) => {
    t.integer("position").nullable().alter();
    t.boolean("is_default").nullable().alter();
  });

  await knex.raw(/* sql */ `
    comment on column dashboard.position is '@deprecated';  
    comment on column dashboard.is_default is '@deprecated';
  `);

  await addUserGroupPermission(knex, "DASHBOARDS:LIST_DASHBOARDS");
  await addUserGroupPermission(knex, "DASHBOARDS:CREATE_DASHBOARDS");

  await knex.raw(/* sql */ `
    with crud_permissions as (
      select user_group_id, effect, created_at, created_by
      from user_group_permission 
      where name = 'DASHBOARDS:CRUD_DASHBOARDS' 
        and deleted_at is null
    )
    insert into user_group_permission (user_group_id, name, effect, created_at, created_by)
    select
      cp.user_group_id,
      'DASHBOARDS:LIST_DASHBOARDS'::user_group_permission_name,
      cp.effect,
      cp.created_at,
      cp.created_by
    from crud_permissions cp
    union all
    select
      cp.user_group_id,
      'DASHBOARDS:CREATE_DASHBOARDS'::user_group_permission_name,
      cp.effect,
      cp.created_at,
      cp.created_by
    from crud_permissions cp;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("dashboard_permission");

  await knex.raw(/* sql */ `
    drop type dashboard_permission_type;
    
    comment on column dashboard.position is null;  
    comment on column dashboard.is_default is null;
  `);

  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("preferences");
  });

  // Temporarily disable the deferred constraint to avoid pending trigger events
  await knex.raw(/* sql */ `
    alter table dashboard drop constraint if exists "dashboard__org_id__position";
  `);

  // Update NULL positions with unique sequential values per org_id to avoid duplicates
  await knex.raw(/* sql */ `
    with max_positions as (
      select 
        org_id,
        coalesce(max(position), -1) as max_pos
      from dashboard 
      where position is not null
      and deleted_at is null
      group by org_id
    ),
    numbered_dashboards as (
      select 
        d.id,
        d.org_id,
        coalesce(mp.max_pos, -1) + row_number() over (partition by d.org_id order by d.id) as new_position
      from dashboard d
      left join max_positions mp on d.org_id = mp.org_id
      where d.position is null
      and d.deleted_at is null
    )
    update dashboard d
    set position = nd.new_position 
    from numbered_dashboards nd 
    where d.id = nd.id
    and d.deleted_at is null;
  `);

  await knex.from("dashboard").update("is_default", false).whereNull("is_default");

  await knex.schema.alterTable("dashboard", (t) => {
    t.integer("position").notNullable().alter();
    t.boolean("is_default").notNullable().defaultTo(false).alter();
  });

  // Recreate the constraint after the ALTER TABLE operations
  await knex.raw(/* sql */ `
    alter table dashboard
    add constraint "dashboard__org_id__position"
    exclude (org_id with =, position with =)
    where (deleted_at is null)
    deferrable initially deferred;
  `);

  await removeUserGroupPermission(knex, "DASHBOARDS:LIST_DASHBOARDS");
  await removeUserGroupPermission(knex, "DASHBOARDS:CREATE_DASHBOARDS");
}
