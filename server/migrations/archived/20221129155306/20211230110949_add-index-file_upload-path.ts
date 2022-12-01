import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index "file_upload__path__idx" on "file_upload" ("path") where "deleted_at" is null;
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
   drop index "file_upload__path__idx";
`);
}
