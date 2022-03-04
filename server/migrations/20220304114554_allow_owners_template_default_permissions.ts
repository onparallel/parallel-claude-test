import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table "template_default_permission" drop constraint "template_default_permission__no_owners";
    alter table "template_default_permission" add constraint "template_default_permission__user_type_owner" check (
        (type = 'OWNER' and user_group_id is null and user_id is not null) or (type != 'OWNER')
    );
    create unique index template_default_permission__owner on "template_default_permission" (template_id)
      where type = 'OWNER' AND deleted_at IS NULL;
  `);
  await knex.raw(/* sql */ `
    insert into template_default_permission (template_id, type, user_id, is_subscribed, position, created_at, created_by, updated_at, updated_by)
    select
      template_id as "template_id",
      'OWNER'::petition_permission_type as "type",
      owner_id as "user_id",
      true as "is_subscribed",
      0 as "position", -- as there will always be only 1 OWNER per public_link, it's ok to hardcode the position to 0
      created_at,
      created_by,
      created_at as "updated_at",
      created_by as "updated_by"
    from public_petition_link
    on conflict (template_id, user_id) where deleted_at is null
    do update set type = EXCLUDED.type returning *;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    delete from "template_default_permission" where type = 'OWNER';
    alter table "template_default_permission" add constraint "template_default_permission__no_owners" check (type != 'OWNER');
    alter table "template_default_permission" drop constraint "template_default_permission__user_type_owner";
    drop index template_default_permission__owner;
  `);
}
