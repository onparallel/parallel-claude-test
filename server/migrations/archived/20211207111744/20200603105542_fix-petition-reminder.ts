import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    update petition_reminder set
      status = 'ERROR'
      where email_log_id is null
  `);
  await knex.raw(/* sql */ `
    update petition_reminder set
      status = 'PROCESSED'
      where email_log_id is not null
  `);
  await knex.raw(/* sql */ `
    update petition_access as pa
      set status = 'INACTIVE'
    from petition as p
    where p.id = pa.petition_id
      and p.deleted_at is not null
      and pa.status = 'ACTIVE';
  `);
  await knex.raw(/* sql */ `
    update petition_message as pm
      set status = 'CANCELLED'
    from petition as p
    where p.id = pm.petition_id
      and p.deleted_at is not null
      and pm.status = 'SCHEDULED';
  `);
}

export async function down(knex: Knex): Promise<any> {}

export const config = {
  transaction: false,
};
