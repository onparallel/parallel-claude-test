import type { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profile_list_view", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.integer("profile_type_id").notNullable().references("profile_type.id");
    t.string("name").notNullable();
    t.jsonb("data").notNullable();
    t.integer("position").notNullable();
    t.enum("view_type", ["ALL", "CUSTOM"], { useNative: true, enumName: "list_view_type" })
      .notNullable()
      .defaultTo("CUSTOM");
    t.boolean("is_default").notNullable().defaultTo(false);
    timestamps(t);
  });

  await knex.schema.alterTable("petition_list_view", (t) => {
    t.specificType("view_type", "list_view_type").notNullable().defaultTo("CUSTOM");

    t.enum("type", ["ALL", "CUSTOM"], {
      enumName: "petition_list_view_type",
      useNative: true,
      existingType: true,
    })
      .nullable()
      .alter();
  });

  await knex.raw(/* sql */ `
    comment on column petition_list_view.type is '@deprecated'; 

    update petition_list_view
    set view_type = type::text::list_view_type
    where type is not null;
  `);

  await knex.raw(/* sql */ `
    -- view positions should not repeat on the same user_id and profile_type_id
    alter table profile_list_view
      add constraint "profile_list_view__user_id__profile_type_id__position" exclude (
        user_id with =,
        profile_type_id with =,
        position with =
      ) where (deleted_at is null) deferrable initially deferred;

    -- to query all the user's views
    create index profile_list_view__user_id__profile_type_id on "profile_list_view" ("user_id", "profile_type_id") where deleted_at is null;

    -- create default INDIVIDUAL views for all users
    with ordered_aliases as (
      select * from (
        values ('p_client_status', 0), ('p_risk', 1), ('p_relationship', 2)
      ) as t("alias", "custom_order")
    ),
    profile_types as (
      select 
        pt.id as profile_type_id, 
        pt.org_id as org_id, 
        array_cat(array_agg(concat('field_', ptf.id) order by oa.custom_order), array['subscribers', 'createdAt']) as field_columns 
      from profile_type pt 
      join profile_type_field ptf on ptf.profile_type_id = pt.id
      join ordered_aliases oa on oa.alias = ptf.alias
      where pt.standard_type = 'INDIVIDUAL'
      and pt.deleted_at is null 
      and ptf.deleted_at is null
      group by pt.id
    )
    insert into profile_list_view (user_id, profile_type_id, name, data, position, is_default, view_type, created_by)
    select 
        u.id,
        pts.profile_type_id,
        'ALL', 
        jsonb_build_object(
          'columns', pts.field_columns,
          'search', null,
          'sort', null,
          'status', null
        ),
        0,
        false,
        'ALL',
        concat('User:', u.id)
      from "user" u 
      join profile_types pts on pts.org_id = u.org_id
      where u.deleted_at is null;

    -- create default LEGAL_ENTITY views for all users
    with ordered_aliases as (
      select * from (
        values ('p_client_status', 0), ('p_risk', 1), ('p_relationship', 2)
      ) as t("alias", "custom_order")
    ),
    profile_types as (
      select 
        pt.id as profile_type_id, 
        pt.org_id as org_id, 
        array_cat(array_agg(concat('field_', ptf.id) order by oa.custom_order), array['subscribers', 'createdAt']) as field_columns 
      from profile_type pt 
      join profile_type_field ptf on ptf.profile_type_id = pt.id
      join ordered_aliases oa on oa.alias = ptf.alias
      where pt.standard_type = 'LEGAL_ENTITY'
      and pt.deleted_at is null 
      and ptf.deleted_at is null
      group by pt.id
    )
    insert into profile_list_view (user_id, profile_type_id, name, data, position, is_default, view_type, created_by)
    select 
        u.id,
        pts.profile_type_id,
        'ALL', 
        jsonb_build_object(
          'columns', pts.field_columns,
          'search', null,
          'sort', null,
          'status', null
        ),
        0,
        false,
        'ALL',
        concat('User:', u.id)
      from "user" u 
      join profile_types pts on pts.org_id = u.org_id
      where u.deleted_at is null;

    -- create default CONTRACT views for all users
    with ordered_aliases as (
      select * from (
        values ('p_signature_date', 0), ('p_expiration_date', 1)
      ) as t("alias", "custom_order")
    ),
    profile_types as (
      select 
        pt.id as profile_type_id, 
        pt.org_id as org_id, 
        array_cat(array_agg(concat('field_', ptf.id) order by oa.custom_order), array['subscribers', 'createdAt']) as field_columns 
      from profile_type pt 
      join profile_type_field ptf on ptf.profile_type_id = pt.id
      join ordered_aliases oa on oa.alias = ptf.alias
      where pt.standard_type = 'CONTRACT'
      and pt.deleted_at is null 
      and ptf.deleted_at is null
      group by pt.id
    )
    insert into profile_list_view (user_id, profile_type_id, name, data, position, is_default, view_type, created_by)
    select 
        u.id,
        pts.profile_type_id,
        'ALL', 
        jsonb_build_object(
          'columns', pts.field_columns,
          'search', null,
          'sort', null,
          'status', null
        ),
        0,
        false,
        'ALL',
        concat('User:', u.id)
      from "user" u 
      join profile_types pts on pts.org_id = u.org_id
      where u.deleted_at is null;

      --create default views for every non-standard profile type
      insert into profile_list_view (user_id, profile_type_id, name, data, position, is_default, view_type, created_by)
      select 
        u.id,
        pt.id,
        'ALL', 
        jsonb_build_object(
          'columns', null,
          'search', null,
          'sort', null,
          'status', null
        ),
        0,
        false,
        'ALL',
        concat('User:', u.id)
      from "user" u 
      join profile_type pt on pt.org_id = u.org_id
      where pt.standard_type is null
      and pt.deleted_at is null
      and u.deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_list_view set type = view_type::text::petition_list_view_type;  
  `);

  await knex.schema.alterTable("petition_list_view", (t) => {
    t.dropColumn("view_type");

    t.enum("type", ["ALL", "CUSTOM"], {
      enumName: "petition_list_view_type",
      useNative: true,
      existingType: true,
    })
      .notNullable()
      .defaultTo("CUSTOM")
      .alter();
  });

  await knex.schema.dropTable("profile_list_view");
  await knex.raw(/* sql */ `
    drop type list_view_type;
    comment on column petition_list_view.type is null;
  `);
}
