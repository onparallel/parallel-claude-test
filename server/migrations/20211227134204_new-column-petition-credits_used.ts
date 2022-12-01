import { Knex } from "knex";
import { PetitionEvent } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.integer("credits_used").notNullable().defaultTo(0);
  });

  // every sent petition used one credit
  const petitionSentEvents = await knex
    .from<PetitionEvent>("petition_event")
    .where({ type: "ACCESS_ACTIVATED" })
    .distinct("petition_id");

  await knex
    .from("petition")
    .whereIn(
      "id",
      petitionSentEvents.map((e) => e.petition_id)
    )
    .update({ credits_used: 1 });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("credits_used");
  });
}
