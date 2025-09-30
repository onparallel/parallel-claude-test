import { Knex } from "knex";
import { sqlValues } from "./helpers/knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.integer("parent_petition_field_id").nullable().references("petition_field.id");
  }).raw(/* sql */ `
    alter table "petition_field" 
    rename constraint "petition_field__petition_id__position" to "petition_field__petition_id__position__old";

    -- new position constraint for fields with null parent_petition_field_id (replaces old one)
    alter table "petition_field" 
    add constraint "petition_field__petition_id__position" 
    exclude ("petition_id" with =, "position" with =) 
    where ((deleted_at is null) and (parent_petition_field_id is null))
    deferrable initially deferred;

    -- new position constraint for "children" fields
    alter table "petition_field" 
    add constraint "petition_field__petition_id__parent_petition_field_id__position" 
    exclude ("petition_id" with =, "parent_petition_field_id" with =, "position" with =) 
    where ((deleted_at is null) and (parent_petition_field_id is not null))
    deferrable initially deferred;

    alter table "petition_field"
    drop constraint "petition_field__petition_id__position__old";
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table "petition_field" 
    rename constraint "petition_field__petition_id__position" to "petition_field__petition_id__position__old";
`);

  // reorder fields of every petition with at least one field with parent_petition_field_id, so we can apply old constraint
  const { rows: petitions } = await knex.raw<{
    rows: { petition_id: number; field_positions: number[] }[];
  }>(/* sql */ `
    with petitions as (
      select distinct(petition_id) id from petition_field where parent_petition_field_id is not null and deleted_at is null
    )
    select pf.petition_id, array_agg(pf.id) field_positions from petition_field pf join petitions p on p.id = pf.petition_id group by pf.petition_id; 
  `);

  for (const petition of petitions) {
    await knex.raw(
      /* sql */ `
    with field_positions as (
      select * from (?) as t(field_id, position)
    )
    update petition_field pf
    set position = fp.position
    from field_positions fp
    where pf.id = fp.field_id;
  `,
      [
        knex.raw(
          ...sqlValues(
            petition.field_positions.map((fieldId, index) => [fieldId, index]),
            ["int", "int"],
          ),
        ),
      ],
    );
  }

  await knex.raw(/* sql */ `
    commit;
    alter table "petition_field" 
    add constraint "petition_field__petition_id__position" 
    exclude ("petition_id" with =, "position" with =) 
    where ((deleted_at is null))
    deferrable initially deferred;
    
    alter table "petition_field"
    drop constraint "petition_field__petition_id__position__old";

    alter table "petition_field"
    drop constraint "petition_field__petition_id__parent_petition_field_id__position";
  `);

  await knex.schema.alterTable("petition_field", (t) => {
    t.dropColumn("parent_petition_field_id");
  });
}
