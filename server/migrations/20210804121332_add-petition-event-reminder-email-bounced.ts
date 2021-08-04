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
  await addPetitionEvent(knex, "PETITION_REMINDER_BOUNCED");
  await addUserNotificationType(knex, "REMINDER_EMAIL_BOUNCED");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "PETITION_REMINDER_BOUNCED");
  await removeUserNotificationType(knex, "REMINDER_EMAIL_BOUNCED");
}
