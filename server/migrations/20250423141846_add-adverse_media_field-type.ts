import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import {
  addFieldType,
  addProfileTypeFieldType,
  removeFieldType,
  removeProfileTypeFieldType,
} from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addProfileTypeFieldType(knex, "ADVERSE_MEDIA_SEARCH");
  await addFieldType(knex, "ADVERSE_MEDIA_SEARCH");
  await addFeatureFlag(knex, "ADVERSE_MEDIA_SEARCH");

  await knex.schema.alterTable("profile_field_value", (t) => {
    t.boolean("is_draft").notNullable().defaultTo(false);
    t.boolean("pending_review").notNullable().defaultTo(false);
    t.boolean("active_monitoring").notNullable().defaultTo(false);
  });

  await knex.raw(/* sql */ `
    update profile_field_value
    set active_monitoring = true
    where type = 'BACKGROUND_CHECK'
    and deleted_at is null
    and removed_at is null
    and is_draft = false;
  `);

  await knex.raw(/* sql */ `
    -- First create new indexes
    CREATE UNIQUE INDEX profile_field_value__current_value_new 
    ON profile_field_value (profile_id, profile_type_field_id) 
    WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (is_draft = false));

    CREATE UNIQUE INDEX profile_field_value__draft_value 
    ON profile_field_value (profile_id, profile_type_field_id) 
    WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (is_draft = true));

    CREATE INDEX profile_field_value__expiring_values_new 
    ON profile_field_value (profile_id, profile_type_field_id) 
    INCLUDE (expiry_date) 
    WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (expiry_date IS NOT NULL) AND (is_draft = false));

    CREATE INDEX profile_field_value__p_id__ptf_id_new 
    ON profile_field_value (profile_id, profile_type_field_id) 
    WHERE ((deleted_at IS NULL) AND (is_draft = false));

    CREATE INDEX profile_field_value__ptf_id_new 
    ON profile_field_value (profile_type_field_id) 
    WHERE ((deleted_at IS NULL) AND (is_draft = false));

    -- After new indexes are created, drop old ones
    DROP INDEX IF EXISTS profile_field_value__current_value;
    DROP INDEX IF EXISTS profile_field_value__expiring_values;
    DROP INDEX IF EXISTS profile_field_value__p_id__ptf_id;
    DROP INDEX IF EXISTS profile_field_value__ptf_id;

    -- Rename new indexes to original names
    ALTER INDEX profile_field_value__current_value_new RENAME TO profile_field_value__current_value;
    ALTER INDEX profile_field_value__expiring_values_new RENAME TO profile_field_value__expiring_values;
    ALTER INDEX profile_field_value__p_id__ptf_id_new RENAME TO profile_field_value__p_id__ptf_id;
    ALTER INDEX profile_field_value__ptf_id_new RENAME TO profile_field_value__ptf_id;
  `);

  await knex.raw(/* sql */ `
    create or replace function profile_field_value_content_is_equal(
      type profile_type_field_type,
      a jsonb,
      b jsonb
    ) returns boolean as $$
    begin
      if type = 'BACKGROUND_CHECK' then
        return (
          a -> 'query' ->> 'name' IS NOT DISTINCT FROM b -> 'query' ->> 'name' and
          a -> 'query' ->> 'date' IS NOT DISTINCT FROM b -> 'query' ->> 'date' and
          a -> 'query' ->> 'type' IS NOT DISTINCT FROM b -> 'query' ->> 'type' and
          a -> 'query' ->> 'country' IS NOT DISTINCT FROM b -> 'query' ->> 'country' and
          a -> 'entity' ->> 'id' IS NOT DISTINCT FROM b -> 'entity' ->> 'id'
        );
    
      elsif type = 'CHECKBOX' then
        return (a -> 'value') @> (b -> 'value') and (a -> 'value') <@ (b -> 'value');
    
      elsif type = 'ADVERSE_MEDIA_SEARCH' then
        return (
          -- Compare search arrays by their id properties
          (SELECT array_agg(DISTINCT COALESCE(search_item ->> 'entityId', search_item ->> 'wikiDataId', search_item ->> 'term')) FROM jsonb_array_elements(a -> 'search') search_item)
          IS NOT DISTINCT FROM
          (SELECT array_agg(DISTINCT COALESCE(search_item ->> 'entityId', search_item ->> 'wikiDataId', search_item ->> 'term')) FROM jsonb_array_elements(b -> 'search') search_item)
          and
          -- Compare articles arrays by their id properties
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(a -> 'articles' -> 'items') article)
          IS NOT DISTINCT FROM
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(b -> 'articles' -> 'items') article)
          and
          -- Compare relevant_articles arrays by their id properties
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(a -> 'relevant_articles') article)
          IS NOT DISTINCT FROM
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(b -> 'relevant_articles') article)
          and
          -- Compare irrelevant_articles arrays by their id properties
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(a -> 'irrelevant_articles') article)
          IS NOT DISTINCT FROM
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(b -> 'irrelevant_articles') article)
          and
          -- Compare dismissed_articles arrays by their id properties
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(a -> 'dismissed_articles') article)
          IS NOT DISTINCT FROM
          (SELECT array_agg(DISTINCT article ->> 'id') FROM jsonb_array_elements(b -> 'dismissed_articles') article)
        );
    
      else
        return a ->> 'value' IS NOT DISTINCT FROM b ->> 'value';
      end if;
    end;
    $$ language plpgsql;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.from("profile_field_value").where("is_draft", true).delete();

  await knex.raw(/* sql */ `
    alter table profile_field_value
    drop column if exists is_draft,
    drop column if exists pending_review,
    drop column if exists active_monitoring;
  `);

  await removeFeatureFlag(knex, "ADVERSE_MEDIA_SEARCH");

  await knex.raw(/* sql */ `
    drop function if exists profile_field_value_content_is_equal(profile_type_field_type, jsonb, jsonb);
  `);

  await knex.raw(/* sql */ `
    -- Create new indexes
    CREATE UNIQUE INDEX profile_field_value__current_value_new 
    ON profile_field_value (profile_id, profile_type_field_id) 
    WHERE ((removed_at IS NULL) AND (deleted_at IS NULL));

    CREATE INDEX profile_field_value__expiring_values_new 
    ON profile_field_value (profile_id, profile_type_field_id) 
    INCLUDE (expiry_date) 
    WHERE ((removed_at IS NULL) AND (deleted_at IS NULL) AND (expiry_date IS NOT NULL));

    CREATE INDEX profile_field_value__p_id__ptf_id_new 
    ON profile_field_value (profile_id, profile_type_field_id) 
    WHERE (deleted_at IS NULL);

    CREATE INDEX profile_field_value__ptf_id_new 
    ON profile_field_value (profile_type_field_id) 
    WHERE (deleted_at IS NULL);

    -- Drop old indexes
    DROP INDEX IF EXISTS profile_field_value__current_value;
    DROP INDEX IF EXISTS profile_field_value__draft_value;
    DROP INDEX IF EXISTS profile_field_value__expiring_values;
    DROP INDEX IF EXISTS profile_field_value__p_id__ptf_id;
    DROP INDEX IF EXISTS profile_field_value__ptf_id;

    -- Rename new indexes to original names
    ALTER INDEX profile_field_value__current_value_new RENAME TO profile_field_value__current_value;
    ALTER INDEX profile_field_value__expiring_values_new RENAME TO profile_field_value__expiring_values;
    ALTER INDEX profile_field_value__p_id__ptf_id_new RENAME TO profile_field_value__p_id__ptf_id;
    ALTER INDEX profile_field_value__ptf_id_new RENAME TO profile_field_value__ptf_id;
  `);

  await knex.raw(/* sql */ `
    alter table petition_field 
    drop constraint petition_field__profile_type_id__field_group; 

    alter table petition_field_reply
    drop constraint petition_field_reply__associated_profile_id__field_group;
  `);

  await removeFieldType(knex, "ADVERSE_MEDIA_SEARCH");
  await removeProfileTypeFieldType(knex, "ADVERSE_MEDIA_SEARCH");

  await knex.raw(/* sql */ `
    alter table petition_field 
    add constraint petition_field__profile_type_id__field_group 
    check (((profile_type_id is null) or ((profile_type_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));

    alter table petition_field_reply
    add constraint petition_field_reply__associated_profile_id__field_group
    check (((associated_profile_id is null) or ((associated_profile_id is not null) and (type = 'FIELD_GROUP'::petition_field_type))));
  `);

  await knex.raw(/* sql */ `
    create or replace function profile_field_value_content_is_equal(
      type profile_type_field_type,
      a jsonb,
      b jsonb
    ) returns boolean as $$
    begin
      if type = 'BACKGROUND_CHECK' then
        return (
          a -> 'query' ->> 'name' IS NOT DISTINCT FROM b -> 'query' ->> 'name' and
          a -> 'query' ->> 'date' IS NOT DISTINCT FROM b -> 'query' ->> 'date' and
          a -> 'query' ->> 'type' IS NOT DISTINCT FROM b -> 'query' ->> 'type' and
          a -> 'query' ->> 'country' IS NOT DISTINCT FROM b -> 'query' ->> 'country' and
          a -> 'entity' ->> 'id' IS NOT DISTINCT FROM b -> 'entity' ->> 'id'
        );
    
      elsif type = 'CHECKBOX' then
        return (a -> 'value') @> (b -> 'value') and (a -> 'value') <@ (b -> 'value');
    
      else
        return a ->> 'value' IS NOT DISTINCT FROM b ->> 'value';
      end if;
    end;
    $$ language plpgsql;
  `);
}
