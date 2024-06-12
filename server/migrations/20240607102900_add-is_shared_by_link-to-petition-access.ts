import type { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.boolean("is_shared_by_link").notNullable().defaultTo(false);
  });

  await addPetitionEvent(knex, "CONTACTLESS_ACCESS_USED");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.dropColumn("is_shared_by_link");
  });

  await removePetitionEvent(knex, "CONTACTLESS_ACCESS_USED");
}
