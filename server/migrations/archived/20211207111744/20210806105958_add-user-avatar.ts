import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.integer("avatar_public_file_id").nullable().references("public_file_upload.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("avatar_public_file_id");
  });
}
