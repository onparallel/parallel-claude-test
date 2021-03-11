import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return await knex.raw(
    /* sql */ `alter table petition_access drop constraint petition_access__reminders_check`
  );
}

export async function down(knex: Knex): Promise<any> {
  return await knex.raw(/* sql */ `ALTER TABLE petition_access ADD CONSTRAINT petition_access__reminders_check CHECK (((reminders_active AND (reminders_config IS NOT NULL)) OR ((NOT reminders_active) AND (reminders_config IS NULL))))
`);
}
