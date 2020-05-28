import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    update petition_access set reminders_left = 10
  `);
  await knex.raw(/* sql */ `
    update petition_access as pa
      set reminders_left = 10 - reminders.count
    from (
      select petition_access_id, count(*) as count
        from petition_reminder
      group by petition_access_id
    ) as reminders
    where reminders.petition_access_id = pa.id;
  `);
}

export async function down(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    update petition_access set reminders_left = 0
  `);
}
