import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE petition_field SET type = 'SHORT_TEXT' WHERE (options->>'multiline')::boolean = false;
    UPDATE petition_field_reply SET type = 'SHORT_TEXT' FROM (SELECT id FROM petition_field WHERE type = 'SHORT_TEXT') AS subquery WHERE petition_field_reply.petition_field_id = subquery.id;
    UPDATE petition_field SET options = options::jsonb - 'multiline' WHERE type = 'SHORT_TEXT' OR type = 'TEXT';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE petition_field SET options = options::jsonb || '{"multiline": true}'::jsonb WHERE type = 'TEXT';
    UPDATE petition_field SET options = options::jsonb || '{"multiline": false}'::jsonb WHERE type = 'SHORT_TEXT';
    UPDATE petition_field SET type = 'TEXT' WHERE type = 'SHORT_TEXT';
    UPDATE petition_field_reply SET type = 'TEXT' WHERE type = 'SHORT_TEXT';
  `);
}
