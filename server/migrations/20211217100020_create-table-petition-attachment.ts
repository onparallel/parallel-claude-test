import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_attachment", (t) => {
    t.increments("id");
    t.integer("petition_id").references("petition.id").notNullable();
    t.integer("file_upload_id").references("file_upload.id").notNullable();
    timestamps(t, { updated: false });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_attachment");
}
