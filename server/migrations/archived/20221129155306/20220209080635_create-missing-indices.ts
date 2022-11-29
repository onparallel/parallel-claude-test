import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index template_default_permission__user_id on template_default_permission (user_id)
      where deleted_at IS NULL and user_id is not null
  `);
  await knex.raw(/* sql */ `
    create index template_default_permission__user_group_id on template_default_permission (user_group_id)
      where deleted_at IS NULL and user_group_id is not null
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index template_default_permission__user_id
  `);
  await knex.raw(/* sql */ `
    drop index template_default_permission__user_group_id
  `);
}
