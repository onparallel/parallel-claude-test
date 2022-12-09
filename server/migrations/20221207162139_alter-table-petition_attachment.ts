import { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_attachment");

  await knex.schema.createTable("petition_attachment", (t) => {
    t.increments("id");
    t.integer("petition_id").references("petition.id").notNullable();
    t.integer("file_upload_id").references("file_upload.id").notNullable();
    t.enum("type", ["FRONT", "ANNEX", "BACK"], {
      useNative: true,
      enumName: "petition_attachment_type",
    }).notNullable();
    t.integer("position").notNullable();
    timestamps(t);
  }).raw(/* sql */ `
    -- positions should not repeat between sections of a petition
    create unique index petition_attachment__petition_id__type__position on "petition_attachment" (petition_id, type, position) where deleted_at is null;
    -- to query all the attachments on the petition
    create index petition_attachment__petition_id on "petition_attachment" (petition_id) where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_attachment");
  await knex.raw(/* sql */ `
    drop type petition_attachment_type;
  `);

  await knex.schema.createTable("petition_attachment", (t) => {
    t.increments("id");
    t.integer("petition_id").references("petition.id").notNullable();
    t.integer("file_upload_id").references("file_upload.id").notNullable();
    timestamps(t, { updated: false });
  });
}
