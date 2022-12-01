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
    insert into template_default_permission (template_id, type, user_id, is_subscribed, created_at, created_by, updated_at, updated_by)
    select p.id, 'OWNER', u1.id, true, ppl.created_at , ppl.created_by , ppl.updated_at , ppl.updated_by from petition p
    join petition_permission pp on p.id = pp.petition_id
    join public_petition_link ppl on p.id = ppl.template_id
    join "user" u1 on ppl.owner_id = u1.id
    where pp.type = 'OWNER' and pp.deleted_at is null and p.deleted_at is null
    and pp.user_id != ppl.owner_id
    and ppl.is_active and p.is_template = true
    on conflict (template_id, user_id) where deleted_at is null
    do update set "type" = EXCLUDED.type returning *; 
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
