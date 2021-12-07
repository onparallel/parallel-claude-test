import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("public_petition_link", (t) => {
      t.increments("id");
      t.integer("template_id").notNullable().references("petition.id");
      t.string("title").notNullable();
      t.text("description").notNullable();
      t.string("slug").notNullable();
      t.boolean("is_active").notNullable().defaultTo(true);
      timestamps(t, { deleted: false });
    })
    .raw(
      /* sql */ `
      -- useful to search by slug
      create unique index "public_petition_link__slug__unique" on "public_petition_link" ("slug") where "is_active" = true;
      alter table "public_petition_link" add constraint "public_petition_link__slug" check (slug ~ '^[a-zA-Z0-9-]*$');
  `
    )
    .createTable("public_petition_link_user", (t) => {
      t.increments("id");
      t.integer("public_petition_link_id").notNullable().references("public_petition_link.id");
      t.integer("user_id").nullable().references("user.id");
      t.specificType("type", "petition_permission_type").notNullable();
      t.boolean("is_subscribed").notNullable().defaultTo(true);
      t.integer("user_group_id").nullable().references("user_group.id");
      t.integer("from_user_group_id").nullable().references("user_group.id");
      timestamps(t);
    })
    .raw(
      /* sql */ `
      -- useful to fetch the public links of a user
      create index "public_petition_link_user__user_id__public_petition_link_id"
      on "public_petition_link_user" (user_id, public_petition_link_id) where deleted_at is null and user_group_id is null;

      -- unique directly assigned users per link
      create unique index "public_petition_link_user__petition_id__user_id" 
      on "public_petition_link_user" (public_petition_link_id, user_id) where deleted_at is null and from_user_group_id is null and user_group_id is null;
      
      -- unique group assigned users per link
      create unique index "public_petition_link_user__from_user_group_id__public_petition_link_id__user_id" 
      on "public_petition_link_user" (from_user_group_id, public_petition_link_id, user_id) where deleted_at is null and from_user_group_id is not null;
      
      -- unique groups per link
      create unique index "public_petition_link_user__user_group_id__public_petition_link_id" 
      on "public_petition_link_user" (user_group_id, public_petition_link_id) where deleted_at is null and user_group_id is not null;

      -- link owner must be directly assigned
      alter table "public_petition_link_user" add constraint "public_petition_link_user__user_type_owner"
      check (
        ("type" = 'OWNER' and "user_group_id" is null and "from_user_group_id" is null and "user_id" is not null)
        or ("type" != 'OWNER')
      );
    `
    )
    .alterTable("petition", (t) => {
      t.integer("from_public_petition_link_id").nullable().references("public_petition_link.id");
    }).raw(/* sql */ `
      -- useful for searching petitions that were created via a public link
      create index "petition__from_public_petition_link_id__idx" on "petition" ("from_public_petition_link_id") where "deleted_at" is null;
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("petition", (t) => {
      t.dropColumn("from_public_petition_link_id");
    })
    .dropTable("public_petition_link_user")
    .dropTable("public_petition_link");
}
