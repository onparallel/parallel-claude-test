import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "PROFILE_SEARCH");
  await addFeatureFlag(knex, "PROFILE_SEARCH_FIELD");

  await knex.raw(/* sql */ `
    create extension if not exists pg_trgm;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PROFILE_SEARCH_FIELD");
  await knex.raw(/* sql */ `
    alter table petition_field 
    drop constraint petition_field__profile_type_id__field_group; 

    alter table petition_field_reply
    drop constraint petition_field_reply__associated_profile_id__field_group;
  `);

  await removeFieldType(knex, "PROFILE_SEARCH");

  await knex.raw(/* sql */ `
    alter table petition_field 
    add constraint petition_field__profile_type_id__field_group 
    check (((profile_type_id is null) or ((profile_type_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));

    alter table petition_field_reply
    add constraint petition_field_reply__associated_profile_id__field_group
    check (((associated_profile_id is null) or ((associated_profile_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));
  `);

  await knex.raw(/* sql */ `
    drop extension if exists pg_trgm;
  `);
}
