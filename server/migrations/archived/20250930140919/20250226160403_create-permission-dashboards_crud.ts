import type { Knex } from "knex";
import { addUserGroupPermission, removeUserGroupPermission } from "./helpers/userGroupPermission";

export async function up(knex: Knex): Promise<void> {
  await addUserGroupPermission(knex, "DASHBOARDS:CRUD_DASHBOARDS");
}

export async function down(knex: Knex): Promise<void> {
  await removeUserGroupPermission(knex, "DASHBOARDS:CRUD_DASHBOARDS");
}
