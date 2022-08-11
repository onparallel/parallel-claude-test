import { Knex } from "knex";
import { uniq } from "remeda";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("contact_id").nullable().alter();
  });
  await knex.raw(/* sql */ `
  create unique index petition_access__petition_id_contactless on petition_access (petition_id) where status = 'ACTIVE' and contact_id is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  const accesess = await knex.from("petition_access").whereNull("contact_id").select();

  const petitionAccessIds = accesess.map((pa) => pa.id);

  if (petitionAccessIds.length) {
    await knex
      .from("petition_event")
      .whereIn("petition_id", uniq(accesess.map((a) => a.petition_id)))
      .whereIn("type", ["ACCESS_ACTIVATED", "ACCESS_DEACTIVATED"])
      .whereIn(knex.raw("(data ->> 'petition_access_id')::int") as any, petitionAccessIds)
      .delete();

    await knex.from("petition_access").whereIn("id", petitionAccessIds).delete();
  }

  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("contact_id").notNullable().alter();
  });

  await knex.raw(/* sql */ `
  drop index petition_access__petition_id_contactless;
`);
}
