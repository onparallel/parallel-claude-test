import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    UPDATE petition_access pa 
    SET status = 'INACTIVE' 
    WHERE contact_id IN (
        SELECT id FROM contact c2 WHERE c2.deleted_at IS NOT NULL 
    )`);
}

export async function down(knex: Knex): Promise<any> {}
