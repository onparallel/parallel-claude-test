import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- rename so we can create a new constraint with same name
    alter table "petition_field" rename constraint "petition_field__petition_id__position" to "petition_field__petition_id__position__old";

    alter table petition_field
      add constraint "petition_field__petition_id__position" exclude (
        petition_id with =,
        position with =
      ) where (deleted_at is null) deferrable initially deferred;

    alter table "petition_field" drop constraint "petition_field__petition_id__position__old";
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    
    alter table "petition_field" rename constraint "petition_field__petition_id__position" to "petition_field__petition_id__position__old";

    alter table "petition_field" add constraint "petition_field__petition_id__position" unique ("petition_id", "position") deferrable;

    alter table "petition_field" drop constraint "petition_field__petition_id__position__old";    
`);
}
