import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_field_attachment", (t) => {
    t.increments("id");
    t.integer("petition_field_id").notNullable().references("petition_field.id");
    t.integer("file_upload_id").notNullable().references("file_upload.id");
    timestamps(t, { updated: false });

    t.unique(
      ["petition_field_id", "file_upload_id"],
      "petition_field_attachment__petition_field_id__file_upload_id__unique"
    );
  });

  await knex.raw(/* sql */ `
    -- useful for loading all the attachments of a field
    create index petition_field_attachment__petition_field_id
    on "petition_field_attachment" ("petition_field_id")
    where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_field_attachment");
}
