import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_field drop constraint if exists petition_field__petition_id__position;
    drop index if exists petition_field__petition_id__position;
    alter table "petition_field" alter column "position" drop not null;
    update "petition_field" set "position" = null where "deleted_at" is not null;
    alter table "petition_field" add constraint "petition_field__petition_id__position__null_deleted_at" check (("position" is null and "deleted_at" is not null) or ("position" is not null and "deleted_at" is null));
    alter table "petition_field" add constraint "petition_field__petition_id__position" unique ("petition_id", "position") deferrable;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table "petition_field" drop constraint "petition_field__petition_id__position";
    alter table "petition_field" drop constraint "petition_field__petition_id__position__null_deleted_at";
    update "petition_field" set "position" = 0 where "position" is null;
    alter table "petition_field" alter column "position" set not null;
    create unique index "petition_field__petition_id__position" on "petition_field" ("petition_id", "position") where "deleted_at" is null;
  `);
}
