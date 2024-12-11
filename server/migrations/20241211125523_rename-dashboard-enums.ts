import type { Knex } from "knex";
import { addModuleType, removeModuleType } from "./helpers/dashboardModuleTypes";

export async function up(knex: Knex): Promise<void> {
  await addModuleType(knex, "PETITIONS_NUMBER");
  await addModuleType(knex, "PETITIONS_RATIO");
  await addModuleType(knex, "PETITIONS_PIE_CHART");
  await addModuleType(knex, "CREATE_PETITION_BUTTON");

  await knex.raw(/* sql */ `
    update dashboard_module set type = 'PETITIONS_NUMBER' where type = 'PARALLELS_NUMBER';
    update dashboard_module set type = 'PETITIONS_RATIO' where type = 'PARALLELS_RATIO';
    update dashboard_module set type = 'PETITIONS_PIE_CHART' where type = 'PARALLELS_PIE_CHART';
    update dashboard_module set type = 'CREATE_PETITION_BUTTON' where type = 'CREATE_PARALLEL_BUTTON';
  `);

  await removeModuleType(knex, "PARALLELS_NUMBER");
  await removeModuleType(knex, "PARALLELS_RATIO");
  await removeModuleType(knex, "PARALLELS_PIE_CHART");
  await removeModuleType(knex, "CREATE_PARALLEL_BUTTON");
}

export async function down(knex: Knex): Promise<void> {
  await addModuleType(knex, "PARALLELS_NUMBER");
  await addModuleType(knex, "PARALLELS_RATIO");
  await addModuleType(knex, "PARALLELS_PIE_CHART");
  await addModuleType(knex, "CREATE_PARALLEL_BUTTON");

  await knex.raw(/* sql */ `
    update dashboard_module set type = 'PARALLELS_NUMBER' where type = 'PETITIONS_NUMBER';
    update dashboard_module set type = 'PARALLELS_RATIO' where type = 'PETITIONS_RATIO';
    update dashboard_module set type = 'PARALLELS_PIE_CHART' where type = 'PETITIONS_PIE_CHART';
    update dashboard_module set type = 'CREATE_PARALLEL_BUTTON' where type = 'CREATE_PETITION_BUTTON';
  `);

  await removeModuleType(knex, "PETITIONS_NUMBER");
  await removeModuleType(knex, "PETITIONS_RATIO");
  await removeModuleType(knex, "PETITIONS_PIE_CHART");
  await removeModuleType(knex, "CREATE_PETITION_BUTTON");
}

export const config = {
  transaction: false,
};
