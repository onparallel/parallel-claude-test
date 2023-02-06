import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- loadReminderByEmailLogId
    CREATE INDEX petition_reminder__email_log_id ON petition_reminder (email_log_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    DROP INDEX petition_reminder__email_log_id;
  `);
}
