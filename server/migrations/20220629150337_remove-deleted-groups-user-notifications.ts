import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    delete from petition_user_notification where type = 'PETITION_SHARED' and ("data"->>'user_group_id')::int in (select id from user_group where deleted_at is not null);
`);
}

export async function down(knex: Knex): Promise<void> {}
