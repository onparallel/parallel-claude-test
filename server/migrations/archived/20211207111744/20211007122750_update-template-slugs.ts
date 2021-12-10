import { Knex } from "knex";
import { Petition } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex
    .from<Petition>("petition")
    .where("template_public", true)
    .update({
      public_metadata: knex.raw(
        `jsonb_set(public_metadata, '{slug}', replace((public_metadata->'slug')::text, '_', '-')::jsonb)`
      ),
    });
}

export async function down(knex: Knex): Promise<void> {}
