import { Knex } from "knex";
import { addUserGroupPermission, removeUserGroupPermission } from "./helpers/userGroupPermission";

export async function up(knex: Knex): Promise<void> {
  await removeUserGroupPermission(knex, "TAGS:CRUD_TAGS");
}

export async function down(knex: Knex): Promise<void> {
  await addUserGroupPermission(knex, "TAGS:CRUD_TAGS");
}
