import { Knex } from "knex";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  await addProfileEvent(knex, "PROFILE_ANONYMIZED");

  await knex.schema.alterTable("profile", (t) => {
    t.timestamp("anonymized_at").defaultTo(null);
  }).raw(/* sql */ `
    CREATE INDEX profile__deleted_at__anonymized_at ON "profile" (id) WHERE ((deleted_at IS NOT NULL) AND (anonymized_at IS NULL));
  `);

  await knex.schema.alterTable("profile_field_file", (t) => {
    t.integer("file_upload_id").nullable().alter();
  }).raw(/* sql */ `
      alter table "profile_field_file" add constraint "profile_field_file__file_upload_id__anonymized_at" 
      check (
        ("file_upload_id" is not null and anonymized_at is null)
        or
        ("file_upload_id" is null and anonymized_at is not null)  
      )
    `);
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileEvent(knex, "PROFILE_ANONYMIZED");

  await knex.raw(/* sql */ `
    DROP INDEX profile__deleted_at__anonymized_at;
  `);

  await knex.schema.alterTable("profile", (t) => {
    t.dropColumn("anonymized_at");
  });

  await knex.schema.alterTable("profile_field_file", (t) => {
    t.integer("file_upload_id").notNullable().alter();
  }).raw(/* sql */ `
      alter table "profile_field_file" drop constraint "profile_field_file__file_upload_id__anonymized_at"
    `);
}
