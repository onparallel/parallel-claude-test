import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_authentication_token", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.string("token_name").notNullable();
    t.string("token_hash").notNullable();
    t.timestamp("last_used_at");
    timestamps(t, { updated: false });
  }).raw(/* sql */ `
    create unique index "user_authentication_token__token_hash" 
    on "user_authentication_token" ("token_hash") where deleted_at is null;
  `).raw(/* sql */ `
    create unique index "user_authentication_token__token_name_user_id" 
    on "user_authentication_token" ("user_id", "token_name") where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_authentication_token");
}
