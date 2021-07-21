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
  await addPetitionEvent(knex, "CONTACT_UNSUBSCRIBE");
  await addUserNotificationType(knex, "CONTACT_UNSUBSCRIBE");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "CONTACT_UNSUBSCRIBE");
  await removeUserNotificationType(knex, "CONTACT_UNSUBSCRIBE");
}
