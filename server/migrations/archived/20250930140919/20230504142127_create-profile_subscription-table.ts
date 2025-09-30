import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("profile_subscription", (t) => {
    t.increments("id");
    t.integer("profile_id").notNullable().references("profile.id");
    t.integer("user_id").notNullable().references("user.id");
    timestamps(t, { updated: false });
  }).raw(/* sql */ `
    create unique index profile_subscription__profile_id__user_id on profile_subscription (profile_id, user_id) where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("profile_subscription");
}
