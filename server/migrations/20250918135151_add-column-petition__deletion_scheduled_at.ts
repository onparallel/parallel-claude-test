import type { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.timestamp("deletion_scheduled_at").nullable();
  });

  await addPetitionEvent(knex, "PETITION_SCHEDULED_FOR_DELETION");
  await addPetitionEvent(knex, "PETITION_RECOVERED_FROM_DELETION");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_list_view set "data" = "data" - 'scheduledForDeletion';
  `);

  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("deletion_scheduled_at");
  });

  await removePetitionEvent(knex, "PETITION_SCHEDULED_FOR_DELETION");
  await removePetitionEvent(knex, "PETITION_RECOVERED_FROM_DELETION");
}
