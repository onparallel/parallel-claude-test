import { Knex } from "knex";
import { addUserGroupPermission, removeUserGroupPermission } from "./helpers/userGroupPermission";

export async function up(knex: Knex): Promise<void> {
  await addUserGroupPermission(knex, "PETITIONS:LIST_PUBLIC_TEMPLATES");

  await knex.raw(/* sql */ `
    insert into user_group_permission (user_group_id, name, effect, created_by, updated_by)
    select 
      ugp.user_group_id,
      'PETITIONS:LIST_PUBLIC_TEMPLATES',
      'GRANT', 
      ugp.created_by,
      ugp.updated_by
    from user_group_permission ugp
    where ugp.name = 'PETITIONS:CREATE_TEMPLATES'
    and ugp.effect = 'GRANT'
    and ugp.deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await removeUserGroupPermission(knex, "PETITIONS:LIST_PUBLIC_TEMPLATES");
}
