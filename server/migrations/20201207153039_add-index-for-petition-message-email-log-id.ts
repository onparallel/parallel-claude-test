import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_message", (t) => {
    t.index(["email_log_id"], "petition_message__email_log_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_message", (t) => {
    t.dropIndex(["email_log_id"], "petition_message__email_log_id");
  });
}
