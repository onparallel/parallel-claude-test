import { Knex } from "knex";
import { difference, groupBy, mapValues, pipe, sortBy } from "remeda";
import { PetitionAccess } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_access rename constraint petition_access__petition_id_contact_id to petition_access__petition_id_contact_id_old;
    create index petition_access__petition_id_contact_id on petition_access (petition_id, contact_id);
    create unique index petition_access__petition_id_contact_id_active on petition_access (petition_id, contact_id) where status = 'ACTIVE';
    alter table petition_access drop constraint petition_access__petition_id_contact_id_old;
    `);
}

export async function down(knex: Knex): Promise<void> {
  // agrupamos por petition_id/contact_id
  // de cada grupo elegimos una, la ELEGIDA que no borraremos (ACTIVE si hay, si no ultima INACTIVE)
  // para cada grupo cogemos las referencias a los petition_access a borrar y las actualizamos a la ELEGIDA

  const { rows: duplicates } = await knex.raw<{ rows: PetitionAccess[] }>(/* sql */ `
    select distinct pa1.*
    from petition_access pa1
    join petition_access pa2 on pa1.petition_id = pa2.petition_id and pa1.contact_id = pa2.contact_id and pa1.id != pa2.id
  `);

  const byPetitionId = groupBy(duplicates, (pa) => pa.petition_id);
  for (const accesses of Object.values(byPetitionId)) {
    const petitionId = accesses[0].petition_id;
    const byContactId = pipe(
      accesses,
      groupBy((pa) => pa.contact_id),
      mapValues((pas) => sortBy(pas, [(pa) => new Date(pa.created_at), "desc"]))
    );
    for (const accesses of Object.values(byContactId)) {
      const remainingAccess = accesses.find((pa) => pa.status === "ACTIVE") ?? accesses[0];
      const accessIdsToRemove = difference(
        accesses.map((pa) => pa.id),
        [remainingAccess.id]
      );

      await knex
        .from("contact_authentication_request")
        .whereIn("petition_access_id", accessIdsToRemove)
        .update({
          petition_access_id: remainingAccess.id,
        });

      await knex
        .from("petition_field_reply")
        .whereIn("petition_access_id", accessIdsToRemove)
        .update({
          petition_access_id: remainingAccess.id,
        });

      await knex
        .from("petition_field_comment")
        .whereIn("petition_access_id", accessIdsToRemove)
        .update({
          petition_access_id: remainingAccess.id,
        });

      await knex
        .from("petition_message")
        .where("petition_id", petitionId)
        .whereIn("petition_access_id", accessIdsToRemove)
        .update({
          petition_access_id: remainingAccess.id,
        });

      await knex
        .from("petition_event")
        .where("petition_id", petitionId)
        .whereIn(knex.raw("(data ->> 'petition_access_id')::int") as any, accessIdsToRemove)
        .update({
          data: knex.raw(`jsonb_set(data, '{petition_access_id}', ?)`, [remainingAccess.id]),
        });

      await knex
        .from("petition_event")
        .where("petition_id", petitionId)
        .whereIn(knex.raw("(data ->> 'new_petition_access_id')::int") as any, accessIdsToRemove)
        .update({
          data: knex.raw(`jsonb_set(data, '{new_petition_access_id}', ?)`, [remainingAccess.id]),
        });

      await knex.from("petition_reminder").whereIn("petition_access_id", accessIdsToRemove).update({
        petition_access_id: remainingAccess.id,
      });

      await knex
        .from("petition_contact_notification")
        .whereIn("petition_access_id", accessIdsToRemove)
        .update({
          petition_access_id: remainingAccess.id,
        });

      await knex
        .from("task")
        .whereNotNull("petition_access_id")
        .whereIn("petition_access_id", accessIdsToRemove)
        .update({
          petition_access_id: remainingAccess.id,
        });

      await knex
        .from("petition_access")
        .where("petition_id", petitionId)
        .whereIn("id", accessIdsToRemove)
        .delete();
    }
  }

  await knex.raw(/* sql */ `
    alter index petition_access__petition_id_contact_id rename to petition_access__petition_id_contact_id_old;
    alter table petition_access add constraint petition_access__petition_id_contact_id unique (petition_id, contact_id);
    drop index petition_access__petition_id_contact_id_active;
    drop index petition_access__petition_id_contact_id_old;
  `);
}
