import { Knex } from "knex";
import { timestamps } from "../../helpers/timestamps";

export async function up(knex: Knex): Promise<any> {
  const columns = [
    "content",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
    "deleted_at",
    "deleted_by",
  ];
  return knex.schema
    .alterTable("petition_field_reply", (t) => {
      columns.forEach((column) => t.renameColumn(column, `_${column}`));
    })
    .alterTable("petition_field_reply", (t) => {
      t.specificType("type", "petition_field_type");
      t.json("content");
      timestamps(t);
    })
    .raw(
      /* sql */ `
      update petition_field_reply as pfr set
        type = pf.type,
        ${columns.map((column) => `${column} = pfr._${column}`).join(", ")}
      from petition_field as pf
        where pfr.petition_field_id = pf.id
    `
    )
    .raw(
      /* sql */ `
      alter table "petition_field_reply" alter column "content" set not null;
      alter table "petition_field_reply" alter column "type" set not null;
    `
    )
    .alterTable("petition_field_reply", (t) => {
      t.dropColumns(...columns.map((column) => `_${column}`));
    });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("petition_field_reply", (t) => {
    t.dropColumn("type");
  });
}
