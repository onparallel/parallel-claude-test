import { Knex } from "knex";

export async function addFieldType(knex: Knex, fieldName: string) {
  await knex.schema.raw(/* sql */ `
    alter type petition_field_type add value '${fieldName}';
  `);
}

export async function removeFieldType(knex: Knex, fieldName: string) {
  await knex.from("petition_field_reply").where("type", fieldName).delete();
  const fields = await knex.from("petition_field").where("type", fieldName).select("id");
  const fieldIds = fields.map((f) => f.id);

  await knex.from("petition_field_attachment").whereIn("petition_field_id", fieldIds).delete();
  await knex.from("petition_field_comment").whereIn("petition_field_id", fieldIds).delete();
  await knex.from("petition_field").whereIn("id", fieldIds).delete();

  const { rows } = await knex.raw<{
    rows: { field_type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::petition_field_type)) as field_type
  `);

  await knex.raw(/* sql */ `
    alter type petition_field_type rename to petition_field_type_old;
    create type petition_field_type as enum (${rows
      .map((r) => r.field_type)
      .filter((f) => f !== fieldName)
      .map((f) => `'${f}'`)
      .join(",")});
    alter table petition_field alter column "type" type petition_field_type using "type"::varchar::petition_field_type;
    alter table petition_field_reply alter column "type" type petition_field_type using "type"::varchar::petition_field_type;
    drop type petition_field_type_old;
  `);
}
