import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `create index "system_event__user_logged_in__index" on "system_event" ((("data" ->> 'user_id')::int)) where "type" = 'USER_LOGGED_IN'`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("drop index system_event__user_logged_in__index");
}
