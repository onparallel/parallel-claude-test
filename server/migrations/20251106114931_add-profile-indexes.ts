import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index profile__org_id__profile_type_id on profile (org_id, profile_type_id) where deleted_at is null;
    create index petition_field__profile_type_field_id on petition_field (profile_type_field_id) where profile_type_field_id is not null and deleted_at is null;

    drop index profile__org_id;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `

    create index profile__org_id on profile (org_id) where deleted_at is null;

    drop index profile__org_id__profile_type_id;
    drop index petition_field__profile_type_field_id;
  `);
}
