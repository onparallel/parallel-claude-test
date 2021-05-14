import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_group", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.string("name").notNullable();
    timestamps(t);
  });
  await knex.raw(/* sql */ `
    create index "user_group__org_id" on "user_group" ("org_id") where "deleted_at" is null;
    create unique index "user_group__org_id__name" on "user_group" ("org_id", "name") where "deleted_at" is null;
  `);
  await knex.schema.createTable("user_group_member", (t) => {
    t.increments("id");
    t.integer("user_group_id").notNullable().references("user_group.id");
    t.integer("user_id").notNullable().references("user.id");
    timestamps(t, { updated: false });
  });
  await knex.raw(
    /* sql */ `create index "user_group_member__user_group_id" on "user_group_member" ("user_group_id") where "deleted_at" is null`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_group_member");
  await knex.schema.dropTable("user_group");
}
