import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addTaskName, removeTaskName } from "./helpers/taskNames";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "DASHBOARDS");
  await addTaskName(knex, "DASHBOARD_REFRESH");

  await knex.schema.createTable("dashboard", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.string("name").notNullable();
    t.integer("position").notNullable();
    t.boolean("is_default").notNullable().defaultTo(false);
    t.boolean("is_refreshing").notNullable().defaultTo(false);
    t.timestamp("last_refresh_at").nullable();
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- loadDashboardsByOrgId
    create index dashboard__org_id on "dashboard" (org_id) include (position) where deleted_at is null;

    -- positions should not repeat on the same org_id
    alter table dashboard
    add constraint "dashboard__org_id__position"
    exclude (org_id with =, position with =)
    where (deleted_at is null)
    deferrable initially deferred;
  `);

  await knex.schema.createTable("dashboard_module", (t) => {
    t.increments("id");
    t.integer("dashboard_id").notNullable().references("dashboard.id");
    t.string("title").nullable();
    t.enum(
      "type",
      [
        "PARALLELS_NUMBER",
        "PROFILES_NUMBER",
        "PARALLELS_RATIO",
        "PROFILES_RATIO",
        "PARALLELS_PIE_CHART",
        "PROFILES_PIE_CHART",
        "CREATE_PARALLEL_BUTTON",
      ],
      {
        useNative: true,
        enumName: "dashboard_module_type",
      },
    ).notNullable();
    t.integer("position").notNullable();
    t.enum("size", ["SMALL", "MEDIUM", "LARGE"], {
      useNative: true,
      enumName: "dashboard_module_size",
    }).notNullable();
    t.jsonb("settings").notNullable();
    t.jsonb("result").nullable();
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- loadModulesByDashboardId
    create index dashboard_module__dashboard_id on "dashboard_module" (dashboard_id) include (position) where deleted_at is null;
    
    -- positions should not repeat on the same dashboard_id
    alter table dashboard_module
    add constraint "dashboard_module__dashboard_id__position"
    exclude (dashboard_id with =, position with =)
    where (deleted_at is null)
    deferrable initially deferred;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("dashboard_module");
  await knex.schema.dropTable("dashboard");
  await knex.raw(/* sql */ `
    drop type dashboard_module_type;
    drop type dashboard_module_size;
  `);

  await removeFeatureFlag(knex, "DASHBOARDS");
  await removeTaskName(knex, "DASHBOARD_REFRESH");
}
