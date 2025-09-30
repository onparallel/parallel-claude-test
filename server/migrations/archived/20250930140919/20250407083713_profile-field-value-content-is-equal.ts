import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
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

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    drop function profile_field_value_content_is_equal(profile_type_field_type, jsonb, jsonb);
  `);
}
