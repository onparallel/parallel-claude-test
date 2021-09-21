import { Knex } from "knex";
import pMap from "p-map";
import { PetitionAccess } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("delegator_contact_id").nullable().references("contact.id");
  });

  const { rows: accesses } = await knex.raw<{ rows: PetitionAccess[] }>(
    "select * from petition_access where created_by like 'Contact:%'"
  );

  pMap(accesses, async (access) => {
    await knex
      .from("petition_access")
      .where("id", access.id)
      .update("delegator_contact_id", parseInt(access.created_by!.split(":")[1], 10));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.dropColumn("delegator_contact_id");
  });
}
