import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition 
    set approval_flow_config = (
      select jsonb_agg(elem || '{"manual_start": true}'::jsonb)
      from jsonb_array_elements(approval_flow_config) as elem
    )
    where approval_flow_config is not null
    and deleted_at is null;
  `);

  await knex.schema.alterTable("petition_approval_request_step", (t) => {
    t.boolean("manual_start").notNullable().defaultTo(false);
  });

  await knex.raw(/* sql */ `
    update petition_approval_request_step
    set manual_start = true;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition 
    set approval_flow_config = (
      select jsonb_agg(elem - 'manual_start')
      from jsonb_array_elements(approval_flow_config) as elem
    )
    where approval_flow_config is not null
    and deleted_at is null;
  `);

  await knex.schema.alterTable("petition_approval_request_step", (t) => {
    t.dropColumn("manual_start");
  });
}

export const config = {
  transaction: false,
};
