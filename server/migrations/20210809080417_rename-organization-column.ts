import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.integer("logo_public_file_id").nullable().references("public_file_upload.id");
  });

  // copy the id in old column "public_file_logo_id" into new col
  await knex.raw(/* sql */ `
    update "organization" set logo_public_file_id = public_file_logo_id where public_file_logo_id is not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("logo_public_file_id");
  });
}
