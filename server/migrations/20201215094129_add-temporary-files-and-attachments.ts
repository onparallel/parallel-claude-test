import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("temporary_file", (t) => {
    t.increments("id");
    t.string("path").notNullable();
    t.string("filename").notNullable();
    t.bigInteger("size").notNullable();
    t.string("content_type").notNullable();
    timestamps(t, { updated: false, deleted: false });
  });

  await knex.schema.createTable("email_attachment", (t) => {
    t.increments("id");
    t.integer("email_log_id").notNullable().references("email_log.id");
    t.integer("temporary_file_id")
      .notNullable()
      .references("temporary_file.id");
    t.unique(["email_log_id", "temporary_file_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("email_attachment");
  await knex.schema.dropTable("temporary_file");
}
