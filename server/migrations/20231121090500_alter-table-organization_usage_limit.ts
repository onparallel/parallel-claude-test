import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization_usage_limit", (t) => {
    t.decimal("limit").notNullable().alter();
    t.decimal("used").notNullable().defaultTo(0).alter();
  });

  await knex.raw(/* sql */ `
  alter table organization_usage_limit drop constraint organization_usage_limit__used__limit__check;

  create index organization_usage_limit__org_id__limit_name 
    on organization_usage_limit (org_id, limit_name)
    where period_end_date is null;
  
  drop index organization_usage_limit__org_id__limit_name__unique;

  alter table organization_usage_limit
    add constraint "organization_usage_limit__org_id__limit_name__unique" exclude (
      org_id with =,
      limit_name with =
    ) where (period_end_date is null) deferrable initially deferred;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization_usage_limit", (t) => {
    t.integer("limit").notNullable().alter();
    t.integer("used").notNullable().defaultTo(0).alter();
  });

  await knex.raw(/* sql */ `

    update organization_usage_limit set "used" = "limit" where "used" > "limit";

    alter table organization_usage_limit
      add constraint organization_usage_limit__used__limit__check
      check ((used <= "limit"));

    alter table organization_usage_limit 
      drop constraint "organization_usage_limit__org_id__limit_name__unique";

    create unique index organization_usage_limit__org_id__limit_name__unique 
      on organization_usage_limit (org_id, limit_name)
      where (period_end_date IS NULL);

    drop index organization_usage_limit__org_id__limit_name;
  `);
}
