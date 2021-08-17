import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("public_petition_link", (t) => {
      t.increments("id");
      t.integer("template_id").notNullable().references("petition.id");
      t.string("title").notNullable();
      t.string("description").notNullable();
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
      t.integer("user_id").notNullable().references("user.id");
      timestamps(t);
    }).raw(/* sql */ `
      create unique index "public_petition_link_user__public_petition_link_id__user_id__unique" on "public_petition_link_user" ("public_petition_link_id", "user_id") where "deleted_at" is null;
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("public_petition_link_user").dropTable("public_petition_link");
}
