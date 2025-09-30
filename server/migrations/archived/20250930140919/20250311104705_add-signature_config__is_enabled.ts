import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition
    set signature_config = signature_config || jsonb_build_object('isEnabled', true)
    where signature_config is not null
    and deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition
    set signature_config = signature_config - 'isEnabled'
    where signature_config is not null
    and deleted_at is null;
  `);
}
