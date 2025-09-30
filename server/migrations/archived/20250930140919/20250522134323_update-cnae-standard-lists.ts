import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field 
    set 
        options = options || jsonb_build_object('standardList', 'CNAE_2009')
    where
        type in ('SELECT', 'CHECKBOX')
        and options->>'standardList' = 'CNAE'
        and deleted_at is null;
  `);

  await knex.raw(/* sql */ `
    update profile_type_field 
    set 
        options = options || jsonb_build_object('standardList', 'CNAE_2009')
    where
        type in ('SELECT', 'CHECKBOX')
        and options->>'standardList' = 'CNAE'
        and deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field 
    set 
        options = options || jsonb_build_object('standardList', 'CNAE')
    where
        type in ('SELECT', 'CHECKBOX')
        and options->>'standardList' = 'CNAE_2009'
        and deleted_at is null;
  `);

  await knex.raw(/* sql */ `
    update profile_type_field 
    set 
        options = options || jsonb_build_object('standardList', 'CNAE')
    where
        type in ('SELECT', 'CHECKBOX')
        and options->>'standardList' = 'CNAE_2009'
        and deleted_at is null;
  `);
}
