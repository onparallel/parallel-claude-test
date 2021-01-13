import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_authentication_token", (t) => {
    t.increments("id");
    t.integer("user_id").notNullable().references("user.id");
    t.string("token_name").notNullable();
    t.string("token_hash").notNullable();
    timestamps(t, { updated: false });
  }).raw(/* sql */ `
    create index "user_authentication_token__user_id" 
    on "user_authentication_token" ("user_id") 
    where deleted_at is null;
  `).raw(/* sql */ `
      create unique index "user_authentication_token__token_name_user_id" 
      on "user_authentication_token" ("token_name", "user_id") where "deleted_at" is null`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_authentication_token");
}
