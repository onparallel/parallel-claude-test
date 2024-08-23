import { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_profile", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.integer("profile_id").notNullable().references("profile.id");
    t.unique(["petition_id", "profile_id"], {
      indexName: "petition_profile__petition_id__profile_id",
    });
    timestamps(t, { updated: false, deleted: false });
  });

  await addPetitionEvent(knex, "PROFILE_ASSOCIATED");
  await addPetitionEvent(knex, "PROFILE_DEASSOCIATED");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "PROFILE_ASSOCIATED");
  await removePetitionEvent(knex, "PROFILE_DEASSOCIATED");

  await knex.schema.dropTable("petition_profile");
}
