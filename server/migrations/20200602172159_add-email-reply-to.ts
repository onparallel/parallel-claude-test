import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable("email_log", (t) => {
    t.text("reply_to");
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable("email_log", (t) => {
    t.dropColumn("reply_to");
  });
}
