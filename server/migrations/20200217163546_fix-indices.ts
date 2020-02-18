import * as Knex from "knex";

export async function up(knex: Knex) {
  return knex.schema
    .alterTable("organization", t => {
      t.dropUnique(["identifier"]);
    })
    .alterTable("user", t => {
      t.dropUnique(["email"]);
    })
    .raw(
      `create unique index "organization_identifier_unique" on "organization" ("identifier") where "deleted_at" is null`
    )
    .raw(
      `create unique index "user_email_unique" on "user" ("email") where "deleted_at" is null`
    );
}

export async function down(knex: Knex) {
  return knex.schema
    .raw(`drop index "user_email_unique"`)
    .raw(`drop index "organization_identifier_unique"`)
    .alterTable("user", t => {
      t.unique(["email"]);
    })
    .alterTable("organization", t => {
      t.unique(["identifier"]);
    });
}
