import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_delegate", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.integer("delegate_user_id").notNullable().references("user.id");
    timestamps(t, { updated: false });
  });
  await knex.raw(/* sql */ `
    create unique index "user_delegate__user_id__delegate_user_id" 
    on "user_delegate" ("user_id", "delegate_user_id") where "deleted_at" is null;
  `);
  await knex.raw(/* sql */ `
    create index "user_delegate__delegate_user_id__user_id" 
    on "user_delegate" ("delegate_user_id", "user_id") where "deleted_at" is null;
  `);

  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("delegate_granter_id").nullable().references("user.id");
  });

  await addFeatureFlag(knex, "ON_BEHALF_OF", false);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_delegate");
  await knex.schema.alterTable("petition_access", (t) => {
    t.dropColumn("delegate_granter_id");
  });
  await removeFeatureFlag(knex, "ON_BEHALF_OF");
}
