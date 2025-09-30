import { Knex } from "knex";
import { addUserGroupPermission, removeUserGroupPermission } from "./helpers/userGroupPermission";

export async function up(knex: Knex): Promise<void> {
  await removeUserGroupPermission(knex, "TEAMS:CRUD_PERMISSIONS");
}

export async function down(knex: Knex): Promise<void> {
  await addUserGroupPermission(knex, "TEAMS:CRUD_PERMISSIONS");
}
