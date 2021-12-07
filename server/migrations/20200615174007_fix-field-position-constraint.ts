import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    drop index "petition_field__petition_id__position"
  `);
  await knex.raw(/* sql */ `
    alter table petition_field
      add constraint "petition_field__petition_id__position" exclude (
        petition_id with =,
        position with =
      ) where (deleted_at is null) deferrable initially deferred
  `);
}

export async function down(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    alter table petition_field drop constraint "petition_field__petition_id__position"
  `);
  await knex.raw(/* sql */ `
    create unique index "petition_field__petition_id__position" on "petition_field" ("petition_id", "position") where "deleted_at" is null
  `);
}
