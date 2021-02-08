import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  await knex.schema
    .createTable("public_file_upload", (t) => {
      t.increments("id");
      t.string("path").notNullable();
      t.string("filename").notNullable();
      t.bigInteger("size").notNullable();
      t.string("content_type").notNullable();
      timestamps(t);
    })
    .alterTable("organization", (t) => {
      t.integer("public_file_logo_id")
        .nullable()
        .references("public_file_upload.id");
    });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("public_file_logo_id");
  });
  await knex.schema.dropTable("public_file_upload");
}
