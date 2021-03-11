import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `alter table org_integration alter column org_id set not null;`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    /* sql */ `alter table org_integration alter column org_id drop not null;`
  );
}
