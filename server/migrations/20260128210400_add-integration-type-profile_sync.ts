import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";
import { addTaskName, removeTaskName } from "./helpers/taskNames";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await addIntegrationType(knex, "PROFILE_SYNC");
  await addFeatureFlag(knex, "PROFILE_SYNC");
  await addTaskName(knex, "PROFILE_SYNC");

  await knex.schema.createTable("profile_sync_log", (t) => {
    t.increments("id");
    t.integer("integration_id").references("org_integration.id").notNullable();
    t.enum("sync_type", ["INITIAL", "TO_LOCAL", "TO_REMOTE"], {
      useNative: true,
      enumName: "profile_sync_log_sync_type",
    }).notNullable();
    t.enum("status", ["PENDING", "COMPLETED", "FAILED"], {
      useNative: true,
      enumName: "profile_sync_log_status",
    }).notNullable();
    t.jsonb("sync_data").notNullable().defaultTo("[]");
    t.jsonb("output").nullable();
    t.jsonb("error").nullable();
    timestamps(t, { deleted: false });
  });

  await knex.raw(/* sql */ `
    create index profile_sync_log__integration_id ON profile_sync_log (integration_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("profile_sync_log");

  await knex.raw(/* sql */ `
    drop type profile_sync_log_sync_type;
    drop type profile_sync_log_status;
  `);

  await removeFeatureFlag(knex, "PROFILE_SYNC");
  await removeIntegrationType(knex, "PROFILE_SYNC");
  await removeTaskName(knex, "PROFILE_SYNC");
}
