import { Knex } from "knex";
import { groupBy, mapValues, sortBy } from "remeda";
import { PetitionAccess } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_access drop constraint petition_access__petition_id_contact_id;
    create unique index petition_access__petition_id_contact_id on petition_access (petition_id, contact_id) where status = 'ACTIVE';
    `);
}

export async function down(knex: Knex): Promise<void> {
  // agrupamos por petition_id/contact_id
  // de cada grupo elegimos una, la ELEGIDA que no borraremos (ACTIVE si hay, si no ultima INACTIVE)
  // para cada grupo cogemos las referencias a los petition_access a borrar y las actualizamos a la ELEGIDA

  const { rows: duplicates }: { rows: PetitionAccess[] } = await knex.raw(
    `
    select distinct pa1.*
    from petition_access pa1
    join petition_access pa2 on pa1.petition_id = pa2.petition_id and pa1.contact_id = pa2.contact_id and pa1.id != pa2.id
  `
  );

  const grouped = groupBy(duplicates, (pa) => pa.contact_id);
  const groupedAndSorted = mapValues(grouped, (val) =>
    sortBy(val, [(pa) => new Date(pa.created_at), "desc"])
  );

  for (const property in groupedAndSorted) {
    const value = groupedAndSorted[property];
    let activeAccessOrLast = value.find((a) => a.status === "ACTIVE");
    if (!activeAccessOrLast) {
      activeAccessOrLast = value[0];
    }
    const petitionAccessIds = value.filter((a) => a.id !== activeAccessOrLast!.id).map((a) => a.id);

    await knex
      .from("contact_authentication_request")
      .whereIn("petition_access_id", petitionAccessIds)
      .update({
        petition_access_id: activeAccessOrLast.id,
      });

    await knex
      .from("petition_field_reply")
      .whereIn("petition_access_id", petitionAccessIds)
      .update({
        petition_access_id: activeAccessOrLast.id,
      });

    await knex
      .from("petition_field_comment")
      .whereIn("petition_access_id", petitionAccessIds)
      .update({
        petition_access_id: activeAccessOrLast.id,
      });

    await knex.from("petition_message").whereIn("petition_access_id", petitionAccessIds).update({
      petition_access_id: activeAccessOrLast.id,
    });

    await knex
      .from("petition_event")
      .whereIn(knex.raw("(data ->> 'petition_access_id')::int") as any, petitionAccessIds)
      .update({
        data: knex.raw(`jsonb_set(data, '{petition_access_id}',?)`, [activeAccessOrLast.id]),
      });

    await knex.from("petition_access").whereIn("id", petitionAccessIds).delete();
  }

  await knex.raw(/* sql */ `
    drop index petition_access__petition_id_contact_id;
    alter table petition_access add constraint petition_access__petition_id_contact_id unique (petition_id, contact_id);
    `);
}
