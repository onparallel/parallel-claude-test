import { Knex } from "knex";
import {
  addUserNotificationType,
  removeUserNotificationType,
} from "./helpers/notificationTypes";
import {
  addPetitionEvent,
  removePetitionEvent,
} from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "REMINDERS_OPT_OUT");
  await addUserNotificationType(knex, "REMINDERS_OPT_OUT");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "REMINDERS_OPT_OUT");
  await removeUserNotificationType(knex, "REMINDERS_OPT_OUT");
}
