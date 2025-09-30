import { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "BANKFLIP_SESSION_COMPLETED");
  await knex.raw(
    /* sql */ `alter table "task" drop constraint "task__user_id__petition_access_id";`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "BANKFLIP_SESSION_COMPLETED");
  await knex.raw(/* sql */ `
    alter table "task" add constraint "task__user_id__petition_access_id" check (
    ("user_id" is null and "petition_access_id" is not null) or ("user_id" is not null and "petition_access_id" is null))
`);
}
