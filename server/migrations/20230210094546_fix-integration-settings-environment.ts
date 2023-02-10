import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update org_integration 
    set "settings" = ("settings" || jsonb_build_object('ENVIRONMENT', "settings"->>'environment')) - 'environment'
    where "settings"->>'environment' is not null;
`);
}

export async function down(knex: Knex): Promise<void> {}
