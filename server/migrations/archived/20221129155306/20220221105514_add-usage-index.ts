import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Make it easier for the organization-limits worker to find limits about to expire
  await knex.raw(/* sql */ `
    create index oul__current_limits on organization_usage_limit ((("period_start_date" at time zone 'UTC') + "period"))
      where period_end_date is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index oul__current_limits
  `);
}
