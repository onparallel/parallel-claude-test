import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user_group", (t) => {
    t.enum("type", ["NORMAL", "ALL_USERS"], {
      useNative: true,
      enumName: "user_group_type",
    })
      .notNullable()
      .defaultTo("NORMAL");
    t.jsonb("localizable_name")
      .notNullable()
      .defaultTo(knex.raw(/* sql */ `jsonb_build_object('en', '')`));
  });

  await knex.raw(/* sql */ `
    insert into user_group (name, localizable_name, org_id, created_at, created_by, type)
    select 
      '', 
      jsonb_build_object('en', 'All users', 'es', 'Todos los usuarios'),
      u.org_id,
      u.created_at,
      concat('User:', u.id),
      'ALL_USERS'
    from "user" u where u.organization_role = 'OWNER' and u.deleted_at is null;
  `);

  await knex.raw(/* sql */ `
    insert into user_group_member (user_group_id, user_id, created_at, created_by)
    select 
      ug.id,
      u.id,
      u.created_at,
      concat('User:', u.id)
    from "user" u
    join "user_group" ug on ug.org_id = u.org_id and ug.type = 'ALL_USERS' and ug.deleted_at is null
    where u.deleted_at is null and u.status = 'ACTIVE';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    delete from "petition_permission" 
    where "user_group_id" in (
      select id from "user_group" where "type" = 'ALL_USERS'
    )
    or "from_user_group_id" in (
      select id from "user_group" where "type" = 'ALL_USERS'
    );
  `);

  await knex.raw(/* sql */ `
    delete from "template_default_permission"
    where "user_group_id" in (
      select id from "user_group" where "type" = 'ALL_USERS'
    );
  `);

  await knex.raw(/* sql */ `
    delete from "profile_type_field_permission"
    where "user_group_id" in (
      select id from "user_group" where "type" = 'ALL_USERS'
    );
  `);

  await knex.raw(/* sql */ `
    delete from "user_group_member"
    where "user_group_id" in (
      select id from "user_group" where "type" = 'ALL_USERS'
    );
  `);

  await knex.raw(/* sql */ `
    delete from "user_group" where "type" = 'ALL_USERS';
`);

  await knex.schema.alterTable("user_group", (t) => {
    t.dropColumns("type", "localizable_name");
  }).raw(/* sql */ `
    drop type user_group_type;
  `);
}
