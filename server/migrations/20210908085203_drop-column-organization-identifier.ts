import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`drop index "organization__identifier"`).alterTable("organization", (t) => {
    t.dropColumn("identifier");
  });
}

export async function down(knex: Knex) {
  await knex.schema
    .alterTable("organization", (t) => {
      t.string("identifier");
    })
    .raw(
      `create unique index "organization__identifier" on "organization" ("identifier") where "deleted_at" is null`
    );
}
