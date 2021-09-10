import { Knex } from "knex";
import pMap from "p-map";
import { omit } from "remeda";
import { PetitionMessage } from "../src/db/__types";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";
import { addSystemEvent, removeSystemEvent } from "./helpers/systemEvents";

async function getPetitionId(petitionMessageId: number, knex: Knex) {
  const [row] = await knex
    .from<PetitionMessage>("petition_message")
    .where("id", petitionMessageId)
    .select("*");

  return row.petition_id;
}

export async function up(knex: Knex): Promise<void> {
  await knex.raw("drop index system_event__user_logged_in__index");

  await addPetitionEvent(knex, "PETITION_MESSAGE_BOUNCED");
  await addPetitionEvent(knex, "PETITION_REMINDER_BOUNCED");

  // move "bounce" system events to petition_event table
  const systemEvents = await knex
    .from("system_event")
    .whereIn("type", ["PETITION_MESSAGE_BOUNCED", "PETITION_REMINDER_BOUNCED"])
    .select("*");

  const newPetitionEvents = await pMap(systemEvents, async (se) => ({
    petition_id:
      se.type === "PETITION_REMINDER_BOUNCED"
        ? se.data.petition_id
        : await getPetitionId(se.data.petition_message_id as number, knex),
    type: se.type,
    data: omit(se.data, ["petition_id"]),
    created_at: se.created_at,
  }));

  if (systemEvents.length > 0) {
    await knex.from("petition_event").insert(newPetitionEvents);
    await knex
      .from("system_event")
      .whereIn(
        "id",
        systemEvents.map((se) => se.id)
      )
      .delete();
  }

  await removeSystemEvent(knex, "PETITION_MESSAGE_BOUNCED");
  await removeSystemEvent(knex, "PETITION_REMINDER_BOUNCED");

  await knex.raw(
    `create index "system_event__user_logged_in__index" on "system_event" ((("data" ->> 'user_id')::int)) where "type" = 'USER_LOGGED_IN'`
  );
}

export async function down(knex: Knex): Promise<void> {
  await addSystemEvent(knex, "PETITION_MESSAGE_BOUNCED");
  await addSystemEvent(knex, "PETITION_REMINDER_BOUNCED");

  // move back "bounce" from petition_event to system_event
  const petitionEvents = await knex
    .from("petition_event")
    .whereIn("type", ["PETITION_MESSAGE_BOUNCED", "PETITION_REMINDER_BOUNCED"])
    .select("*");

  const newSystemEvents = await pMap(petitionEvents, async (pe) => ({
    type: pe.type,
    data:
      pe.type === "PETITION_MESSAGE_BOUNCED"
        ? pe.data
        : { ...pe.data, petition_id: pe.petition_id },
    created_at: pe.created_at,
  }));

  if (petitionEvents.length > 0) {
    await knex.from("system_event").insert(newSystemEvents);
    await knex
      .from("petition_event")
      .whereIn(
        "id",
        petitionEvents.map((pe) => pe.id)
      )
      .delete();
  }
  await removePetitionEvent(knex, "PETITION_MESSAGE_BOUNCED");
  await removePetitionEvent(knex, "PETITION_REMINDER_BOUNCED");
}

export const config = {
  transaction: false,
};
