import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  // move the OWNER of each public_petition_link from public_petition_link_user to new column public_petition_link.owner_id
  await knex.schema.alterTable("public_petition_link", (t) => {
    t.integer("owner_id").nullable().references("user.id");
  });
  await knex.raw(/* sql */ `
    update public_petition_link ppl
      set owner_id = pplu.user_id
      from public_petition_link_user pplu
      where pplu.deleted_at is null and pplu.type = 'OWNER' and pplu.public_petition_link_id = ppl.id;
  `);
  await knex.schema.alterTable("public_petition_link", (t) => {
    t.integer("owner_id").notNullable().alter();
  });

  await knex.schema.createTable("template_default_permission", (t) => {
    t.increments("id");
    t.integer("template_id").notNullable().references("petition.id");
    t.specificType("type", "petition_permission_type").notNullable();
    t.integer("user_id").nullable().references("user.id");
    t.integer("user_group_id").nullable().references("user_group.id");
    t.boolean("is_subscribed").notNullable().defaultTo(true);
    t.integer("position").notNullable();
    timestamps(t);
  }).raw(/* sql */ `

    -- useful to fetch all the default permissions given a template_id
    create index "template_default_permission__template_id"
    on "template_default_permission" (template_id) where deleted_at is null;

    create unique index "template_default_permission__template_id__user_id"
    on "template_default_permission" (template_id, user_id) where deleted_at is null;

    create unique index "template_default_permission__template_id__user_group_id"
    on "template_default_permission" (template_id, user_group_id) where deleted_at is null;

    -- can't add OWNERS to this table
    alter table "template_default_permission" add constraint "template_default_permission__no_owners" check (type != 'OWNER');

    alter table "template_default_permission" add constraint "template_default_permission__user_or_user_group" check (
      (user_id is null)::int + (user_group_id is null)::int = 1
    );
  `);

  // move every row in public_petition_link_user to template_default_permission
  await knex.raw(/* sql */ `
    insert into template_default_permission (template_id, type, user_id, user_group_id, is_subscribed, created_at, created_by, updated_at, updated_by, position)
    select
      ppl.template_id,
      pplu.type,
      pplu.user_id,
      pplu.user_group_id,
      pplu.is_subscribed,
      pplu.created_at,
      pplu.created_by,
      pplu.updated_at,
      pplu.updated_by,
      row_number() over (partition by ppl.template_id order by pplu.id) - 1 as position
    from public_petition_link ppl
    join public_petition_link_user pplu on ppl.id = pplu.public_petition_link_id
    where pplu.deleted_at is null and pplu.type != 'OWNER'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTable("template_default_permission")
    .alterTable("public_petition_link", (t) => {
      t.dropColumn("owner_id");
    });
}
