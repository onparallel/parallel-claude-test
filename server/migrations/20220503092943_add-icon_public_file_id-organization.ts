import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.integer("icon_public_file_id").nullable().references("public_file_upload.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("icon_public_file_id");
  });
}
