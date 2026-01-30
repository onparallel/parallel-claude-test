import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition 
    set "approval_flow_config" = (
      select jsonb_agg(elem || jsonb_build_object('allow_edit', false))
      from jsonb_array_elements("approval_flow_config") as elem
    )
    where "approval_flow_config" is not null;
  `);

  await knex.schema.alterTable("petition_approval_request_step", (t) => {
    t.boolean("allow_edit").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition set "approval_flow_config" = (
      select jsonb_agg(elem - 'allow_edit')
      from jsonb_array_elements("approval_flow_config") as elem
    )
    where "approval_flow_config" is not null;
  `);

  await knex.schema.alterTable("petition_approval_request_step", (t) => {
    t.dropColumn("allow_edit");
  });
}
