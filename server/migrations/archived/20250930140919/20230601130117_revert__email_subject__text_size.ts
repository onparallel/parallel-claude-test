import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_message", (t) => {
    t.string("email_subject", 255).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_message", (t) => {
    t.string("email_subject", 1000).alter();
  });
}
