import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update profile_list_view 
    set data = data || jsonb_build_object('status', array[data->'status']) 
    where (data->'status') != 'null'::jsonb
    and deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update profile_list_view 
    set data = data || jsonb_build_object('status', data->'status'->0) 
    where (data->'status') != 'null'::jsonb
    and deleted_at is null;
  `);
}
