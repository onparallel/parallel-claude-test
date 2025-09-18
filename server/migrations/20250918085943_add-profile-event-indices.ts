import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index profile_event__processed_at on profile_event (id) where processed_at is null;
    create index profile_event__profile_id__type on profile_event (profile_id, type);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index profile_event__processed_at;
    drop index profile_event__profile_id__type;
  `);
}
