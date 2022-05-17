import { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.specificType("anonymize_petitions_after", "interval").nullable().defaultTo(null);
  });
  await addPetitionEvent(knex, "PETITION_ANONYMIZED");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "PETITION_ANONYMIZED");
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("anonymize_petitions_after");
  });
}
