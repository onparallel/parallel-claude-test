import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `
    update petition_field pf
    set options = jsonb_set(
      pf.options::jsonb,
      '{hasCommentsEnabled}',
      (case
        when not p.comments_enabled then 'false'
        when pf.type = 'HEADING' then 'false'
        else 'true'
      end)::jsonb)::json
    from petition p
    where p.id = pf.petition_id;
    `,
    []
  );
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.raw(/* sql */ `
    update petition_field set options = (options::jsonb - 'hasCommentsEnabled')::json
  `);
}
