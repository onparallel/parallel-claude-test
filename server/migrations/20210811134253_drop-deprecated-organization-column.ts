import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("public_file_logo_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.integer("public_file_logo_id").nullable().references("public_file_upload.id");
  });

  await knex.raw(/* sql */ `
    update "organization" set public_file_logo_id = logo_public_file_id where logo_public_file_id is not null;
`);
}
