import { Knex } from "knex";
import pMap from "p-map";
import { Petition, PetitionField } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  const petitions = await knex.from<Petition>("petition").select("*");

  await pMap(petitions, async (petition) => {
    const fields = await knex
      .from<PetitionField>("petition_field")
      .where("petition_id", petition.id)
      .select("*");

    for (const field of fields) {
      const updatedOptions = petition.comments_enabled
        ? { ...field.options, hasCommentsEnabled: field.type === "HEADING" ? false : true }
        : { ...field.options, hasCommentsEnabled: false };

      await knex
        .from<PetitionField>("petition_field")
        .where("id", field.id)
        .update("options", updatedOptions);
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.raw(
    `update petition_field set options = (options::jsonb - 'hasCommentsEnabled')::json`
  );
}
