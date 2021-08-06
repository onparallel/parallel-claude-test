import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.integer("public_file_avatar_id")
      .nullable()
      .references("public_file_upload.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("public_file_avatar_id");
  });
}
