import type { Knex } from "knex";
import {
  addFieldType,
  addProfileTypeFieldType,
  removeFieldType,
  removeProfileTypeFieldType,
} from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "USER_ASSIGNMENT");
  await addProfileTypeFieldType(knex, "USER_ASSIGNMENT");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_field 
    drop constraint petition_field__profile_type_id__field_group; 

    alter table petition_field_reply
    drop constraint petition_field_reply__associated_profile_id__field_group;
    
    drop function profile_field_value_content_is_equal(profile_type_field_type, jsonb, jsonb);

    drop index petition_field_reply__adverse_media__child_reply_unique;
    drop index petition_field_reply__adverse_media__reply_unique;
  `);

  await removeFieldType(knex, "USER_ASSIGNMENT");
  await removeProfileTypeFieldType(knex, "USER_ASSIGNMENT");

  await knex.raw(/* sql */ `
    alter table petition_field 
    add constraint petition_field__profile_type_id__field_group 
    check (((profile_type_id is null) or ((profile_type_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));

    alter table petition_field_reply
    add constraint petition_field_reply__associated_profile_id__field_group
    check (((associated_profile_id is null) or ((associated_profile_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));

    CREATE FUNCTION profile_field_value_content_is_equal(type profile_type_field_type, a jsonb, b jsonb) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
    begin
      -- on complex fields we don't want to compare, and will always assume they are different
      if (type = 'BACKGROUND_CHECK' or type = 'ADVERSE_MEDIA_SEARCH') then
        return false;
        
      elsif type = 'CHECKBOX' then
        return (a -> 'value') @> (b -> 'value') and (a -> 'value') <@ (b -> 'value');
    
      else
        return a ->> 'value' IS NOT DISTINCT FROM b ->> 'value';
      end if;
    end;
    $$;

    CREATE UNIQUE INDEX petition_field_reply__adverse_media__child_reply_unique 
    ON petition_field_reply USING btree (petition_field_id, parent_petition_field_reply_id) 
    WHERE (
      (type = 'ADVERSE_MEDIA_SEARCH'::petition_field_type) 
      AND (parent_petition_field_reply_id IS NOT NULL)
      AND (deleted_at IS NULL)
    );

    CREATE UNIQUE INDEX petition_field_reply__adverse_media__reply_unique
    ON petition_field_reply USING btree (petition_field_id)
    WHERE (
      (type = 'ADVERSE_MEDIA_SEARCH'::petition_field_type)
      AND (parent_petition_field_reply_id IS NULL) 
      AND (deleted_at IS NULL)
    );
  `);
}
