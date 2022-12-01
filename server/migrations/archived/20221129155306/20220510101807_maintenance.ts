import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.dropColumns(
      "cognito_id",
      "email",
      "first_name",
      "last_name",
      "is_sso_user",
      "avatar_public_file_id",
      "details"
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.string("cognito_id").nullable();
    t.string("email").nullable();
    t.string("first_name").nullable();
    t.string("last_name").nullable();
    t.boolean("is_sso_user").nullable();
    t.integer("avatar_public_file_id").nullable().references("public_file_upload.id");
    t.jsonb("details").nullable();
  });
}
