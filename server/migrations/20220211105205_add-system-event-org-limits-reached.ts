import { Knex } from "knex";
import { addSystemEvent, removeSystemEvent } from "./helpers/systemEvents";

export async function up(knex: Knex): Promise<void> {
  await addSystemEvent(knex, "ORGANIZATION_LIMIT_REACHED");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `drop index system_event__user_logged_in__index`);
  await removeSystemEvent(knex, "ORGANIZATION_LIMIT_REACHED");
  await knex.raw(/* sql */ `create index system_event__user_logged_in__index on system_event (((data ->> 'user_id'::text)::integer))
  where
      (type = 'USER_LOGGED_IN'::system_event_type);`);
}
