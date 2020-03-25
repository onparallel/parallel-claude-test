import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.createTable("file_upload", (t) => {
    t.increments("id");
    t.string("path").notNullable();
    t.string("filename").notNullable();
    t.bigInteger("size").notNullable();
    t.string("content_type").notNullable();
    t.boolean("upload_complete").notNullable().defaultTo(false);
    timestamps(t);
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.dropTable("file_upload");
}
