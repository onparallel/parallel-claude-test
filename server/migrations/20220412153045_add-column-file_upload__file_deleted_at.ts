import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("file_upload", (t) => {
    t.timestamp("file_deleted_at").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("file_upload", (t) => {
    t.dropColumn("file_deleted_at");
  });
}
