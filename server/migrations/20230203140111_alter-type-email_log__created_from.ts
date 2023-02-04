import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("email_log", (t) => {
    t.text("created_from").notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("email_log", (t) => {
    t.string("created_from").notNullable().alter();
  });
}
