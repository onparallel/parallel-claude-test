import { Knex } from "knex";
import {
  addUserOrganizationRole,
  removeUserOrganizationRole,
} from "./helpers/userOrganizationRoles";

export async function up(knex: Knex): Promise<void> {
  await addUserOrganizationRole(knex, "OWNER");

  await knex.raw(/* sql */ `
    -- first created user of each organization will be OWNER
    update "user" set organization_role = 'OWNER' where id in (
      select min(id) owner_id from "user" where deleted_at is null group by org_id
    );

    -- each organization must have only one owner
    create unique index "user__organization_role__owner" on "user" ("org_id") where organization_role = 'OWNER' and deleted_at is null;
    `);
}

export async function down(knex: Knex): Promise<void> {
  // drop owner constraint
  await knex.raw(`drop index "user__organization_role__owner"`);

  await removeUserOrganizationRole(knex, "OWNER", "ADMIN");
}

export const config = {
  transaction: false,
};
