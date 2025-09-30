import { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "PROFILE_DISASSOCIATED");
  await addProfileEvent(knex, "PETITION_DISASSOCIATED");

  await knex
    .from("petition_event")
    .where("type", "PROFILE_DEASSOCIATED")
    .update({ type: "PROFILE_DISASSOCIATED" as any });

  await knex
    .from("profile_event")
    .where("type", "PETITION_DEASSOCIATED")
    .update({ type: "PETITION_DISASSOCIATED" as any });
}

export async function down(knex: Knex): Promise<void> {
  await knex
    .from("profile_event")
    .where("type", "PETITION_DISASSOCIATED")
    .update({ type: "PETITION_DEASSOCIATED" });

  await knex
    .from("petition_event")
    .where("type", "PROFILE_DISASSOCIATED")
    .update({ type: "PROFILE_DEASSOCIATED" });

  await removeProfileEvent(knex, "PETITION_DISASSOCIATED");
  await removePetitionEvent(knex, "PROFILE_DISASSOCIATED");
}

export const config = {
  transaction: false,
};
