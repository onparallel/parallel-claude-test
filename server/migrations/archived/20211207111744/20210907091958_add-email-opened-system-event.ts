import { Knex } from "knex";
import { addSystemEvent, removeSystemEvent } from "./helpers/systemEvents";

export async function up(knex: Knex): Promise<void> {
  await addSystemEvent(knex, "EMAIL_OPENED");
}

export async function down(knex: Knex): Promise<void> {
  await removeSystemEvent(knex, "EMAIL_OPENED");
}
