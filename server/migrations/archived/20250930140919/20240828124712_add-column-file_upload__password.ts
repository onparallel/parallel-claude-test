import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("file_upload", (t) => {
    t.string("password").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("file_upload", (t) => {
    t.dropColumn("password");
  });
}
