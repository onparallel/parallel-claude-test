import type { Knex } from "knex";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  // update profile_field_value_content_is_equal to not compare complex contents like BACKGROUND_CHECK and ADVERSE_MEDIA_SEARCH
  await knex.raw(/* sql */ `
    create or replace function profile_field_value_content_is_equal(
      type profile_type_field_type,
      a jsonb,
      b jsonb
    ) returns boolean as $$
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
    $$ language plpgsql;
  `);

  // Mark all BACKGROUND_CHECK search results as false positives on petition and profile replies
  await knex.raw(/* sql */ `
    update petition_field_reply
    set content = content || jsonb_build_object(
      'falsePositives', 
      (
        select jsonb_agg(jsonb_build_object('id', value, 'addedAt', "created_at", 'addedByUserId', "user_id")) 
        from jsonb_array_elements_text(jsonb_path_query_array(content->'search'->'items', 'strict $[*].id')) as value
        -- When entity is null, mark all search items as false positives
        -- When entity is not null, mark all search items except the entity id as false positives
        where content->'entity' = 'null'::jsonb or value != content->'entity'->>'id'
      )
    )
    where type = 'BACKGROUND_CHECK'
    and deleted_at is null
    and anonymized_at is null;

    update profile_field_value
    set content = content || jsonb_build_object(
      'falsePositives', 
      (
        select jsonb_agg(jsonb_build_object('id', value, 'addedAt', "created_at", 'addedByUserId', "created_by_user_id")) 
        from jsonb_array_elements_text(jsonb_path_query_array(content->'search'->'items', 'strict $[*].id')) as value
        -- When entity is null, mark all search items as false positives
        -- When entity is not null, mark all search items except the entity id as false positives
        where content->'entity' = 'null'::jsonb or value != content->'entity'->>'id'
      )
    )
    where type = 'BACKGROUND_CHECK'
    and deleted_at is null
    and anonymized_at is null;
  `);

  // add profile event for when monitor detects no changes
  await addProfileEvent(knex, "PROFILE_FIELD_VALUE_MONITORED");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileEvent(knex, "PROFILE_FIELD_VALUE_MONITORED");

  await knex.raw(/* sql */ `
    update petition_field_reply
    set content = content - 'falsePositives'
    where type = 'BACKGROUND_CHECK';

    update profile_field_value
    set content = content - 'falsePositives'
    where type = 'BACKGROUND_CHECK';
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
