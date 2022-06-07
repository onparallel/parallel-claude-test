import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.integer("anonymize_petitions_after_days").nullable().defaultTo(null);
  });
  await addPetitionEvent(knex, "PETITION_ANONYMIZED");
  await addFeatureFlag(knex, "AUTO_ANONYMIZE", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "AUTO_ANONYMIZE");
  await removePetitionEvent(knex, "PETITION_ANONYMIZED");
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("anonymize_petitions_after_days");
  });
}
