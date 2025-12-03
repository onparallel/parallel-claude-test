import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index petition_field__profile_type_id on petition_field (profile_type_id) where deleted_at is null and profile_type_id is not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index petition_field__profile_type_id;
  `);

  await knex.raw(/* sql */ `
    update petition_field 
      set 
        "options" = "options" - 'updateProfileOnClose'
      where 
        type = 'FIELD_GROUP';
  `);
}
