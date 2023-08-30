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

    alter table "petition_field" drop constraint "petition_field__petition_id__position__null_deleted_at";

    update "petition_field" set "position" = 0 where "position" is null;

    alter table "petition_field" alter column "position" set not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table "petition_field" alter column "position" drop not null;

    update "petition_field" set "position" = null where "deleted_at" is not null;

    alter table "petition_field" add constraint "petition_field__petition_id__position__null_deleted_at" check (("position" is null and "deleted_at" is not null) or ("position" is not null and "deleted_at" is null));
    
    alter table "petition_field" rename constraint "petition_field__petition_id__position" to "petition_field__petition_id__position__old";

    alter table "petition_field" add constraint "petition_field__petition_id__position" unique ("petition_id", "position") deferrable;

    alter table "petition_field" drop constraint "petition_field__petition_id__position__old";    
`);
}
