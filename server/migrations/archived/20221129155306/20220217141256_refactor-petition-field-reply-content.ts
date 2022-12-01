import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field_reply set "content" = "content" - 'text' || jsonb_build_object('value', ("content"->>'text')) where "type" in ('SHORT_TEXT', 'TEXT', 'SELECT');
 
    update petition_field_reply set "content" = "content" - 'choices' || jsonb_build_object('value', ("content"->>'choices')::jsonb) where "type" = 'CHECKBOX';
    
    update petition_field_reply set "content" = "content" - 'columns' || jsonb_build_object('value', ("content"->>'columns')::jsonb) where "type" = 'DYNAMIC_SELECT';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field_reply set "content" = "content" - 'value' || jsonb_build_object('text', ("content"->>'value')) where "type" in ('SHORT_TEXT', 'TEXT', 'SELECT');

    update petition_field_reply set "content" = "content" - 'value' || jsonb_build_object('choices', ("content"->>'value')::jsonb) where "type" = 'CHECKBOX';
    
    update petition_field_reply set "content" = "content" - 'value' || jsonb_build_object('columns', ("content"->>'value')::jsonb) where "type" = 'DYNAMIC_SELECT';
  `);
}
