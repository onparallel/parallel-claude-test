import type { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_comment_attachment", (t) => {
    t.increments("id");
    t.integer("petition_comment_id").notNullable().references("petition_field_comment.id");
    t.integer("file_upload_id").notNullable().references("file_upload.id");
    timestamps(t, { updated: false });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_comment_attachment");
}
