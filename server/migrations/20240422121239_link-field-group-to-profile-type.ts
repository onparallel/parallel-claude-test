import type { Knex } from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_field", (t) => {
    t.integer("profile_type_id").nullable().defaultTo(null);
    t.integer("profile_type_field_id").nullable().defaultTo(null);
  });

  // petition_field FKs
  await knex.raw(/* sql */ `
    alter table petition_field 
      add constraint petition_field_profile_type_id_foreign
      foreign key (profile_type_id) references profile_type(id) not valid,
      add constraint petition_field_profile_type_field_id_foreign
      foreign key (profile_type_field_id) references profile_type_field(id) not valid;

    alter table petition_field
      validate constraint petition_field_profile_type_id_foreign,
      validate constraint petition_field_profile_type_field_id_foreign;
  `);

  // petition_field constraints
  await knex.raw(/* sql */ `
    -- profile_type_id can only be set when the field is a FIELD_GROUP
    alter table petition_field
    add constraint petition_field__profile_type_id__field_group
    check (
        ("profile_type_id" is null)
        or
        ("profile_type_id" is not null and "type" = 'FIELD_GROUP')
    ) not valid;

    -- profile_type_field_id can only be set when the field is a child of a FIELD_GROUP
    alter table petition_field
    add constraint petition_field__profile_type_field_id__child_field
    check (
        ("profile_type_field_id" is null)
        or
        ("profile_type_field_id" is not null and "parent_petition_field_id" is not null)
    ) not valid;

    alter table petition_field
      validate constraint petition_field__profile_type_id__field_group,
      validate constraint petition_field__profile_type_field_id__child_field;
`);

  // petition_field indexes
  await knex.raw(/* sql */ `
    -- ensure profile_type_field_id is added only once per parent_petition_field_id
    create unique index petition_field__parent_petition_field_id__profile_type_field_id
    on petition_field (parent_petition_field_id, profile_type_field_id)
    where parent_petition_field_id is not null and profile_type_field_id is not null and deleted_at is null;
  `);

  await knex.schema.alterTable("petition_field_reply", (t) => {
    t.integer("associated_profile_id").nullable().defaultTo(null);
  });

  // petition_field_reply FKs
  await knex.raw(/* sql */ `
    alter table petition_field_reply
      add constraint petition_field_reply_associated_profile_id_foreign
      foreign key (associated_profile_id) references profile(id) not valid;

    alter table petition_field_reply
      validate constraint petition_field_reply_associated_profile_id_foreign;
  `);

  // petition_field_reply constraints
  await knex.raw(/* sql */ `
    -- associated_profile_id can only be set when the field is a FIELD_GROUP
    alter table petition_field_reply
    add constraint petition_field_reply__associated_profile_id__field_group
    check (
        ("associated_profile_id" is null)
        or
        ("associated_profile_id" is not null and "type" = 'FIELD_GROUP')
    ) not valid;

    alter table petition_field_reply
      validate constraint petition_field_reply__associated_profile_id__field_group;
  `);

  // petition_field_reply indexes
  await knex.raw(/* sql */ `
    -- useful for removing association when profile is deleted
    create index petition_field_reply__associated_profile_id
      on petition_field_reply (associated_profile_id) where associated_profile_id is not null and deleted_at is null;
  `);

  await knex.schema.createTable("petition_field_group_relationship", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.integer("left_side_petition_field_id").notNullable().references("petition_field.id");
    t.integer("profile_relationship_type_id")
      .notNullable()
      .references("profile_relationship_type.id");
    t.specificType("direction", "profile_relationship_type_direction").notNullable();
    t.integer("right_side_petition_field_id").notNullable().references("petition_field.id");

    timestamps(t);
  });

  await knex.raw(/* sql */ `
    create unique index petition_field_group_relationship__avoid_duplicates
    on petition_field_group_relationship (petition_id, left_side_petition_field_id, right_side_petition_field_id, profile_relationship_type_id, direction) where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop table if exists petition_field_group_relationship;

    alter table petition_field drop column if exists profile_type_id;
    alter table petition_field drop column if exists profile_type_field_id;
    
    alter table petition_field_reply drop column if exists associated_profile_id; 
  `);
}

export const config = {
  transaction: false,
};
