import { Knex } from "knex";
import { addSystemEvent, removeSystemEvent } from "./helpers/systemEvents";

export async function up(knex: Knex): Promise<void> {
  await addSystemEvent(knex, "EMAIL_VERIFIED");
  await addSystemEvent(knex, "INVITE_SENT");
}

export async function down(knex: Knex): Promise<void> {
  await removeSystemEvent(knex, "EMAIL_VERIFIED");
  await removeSystemEvent(knex, "INVITE_SENT");
}
