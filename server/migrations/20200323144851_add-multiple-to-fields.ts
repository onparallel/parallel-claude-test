import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  const columns = [
    "options",
    "validated",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "deleted_at",
    "deleted_by",
  ];
  return knex.schema
    .alterTable("petition_field", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));
    })
    .alterTable("petition_field", (t) => {
      t.boolean("multiple").defaultTo(true);
      t.json("options");
      t.boolean("validated").defaultTo(false).notNullable();
      timestamps(t);
    })
    .raw(
      /* sql */ `
      update petition_field as pf set
        multiple = (case type when 'TEXT' then false else true end),
        ${columns.map((column) => `${column} = pf._${column}`).join(", ")}
    `
    )
    .raw(
      /* sql */ `
      alter table "petition_field" alter column "multiple" set not null;
    `
    )
    .raw(
      /* sql */ `
      update petition_field as pf set
        options = (options::jsonb - 'multiple')::json
      where type = 'FILE_UPLOAD'
    `
    )
    .alterTable("petition_field", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("type");
  }).raw(/* sql */ `
      update petition_field as pf set
        options = jsonb_set(options::jsonb, '{multiple}', 'true')::json
      where type = 'FILE_UPLOAD'
    `);
}
