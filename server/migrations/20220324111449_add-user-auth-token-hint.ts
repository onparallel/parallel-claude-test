import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user_authentication_token", (t) => {
    t.string("token_hint").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user_authentication_token", (t) => {
    t.dropColumn("token_hint");
  });
}
