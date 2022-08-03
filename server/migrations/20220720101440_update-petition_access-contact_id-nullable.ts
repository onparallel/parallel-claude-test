import { Knex } from "knex";
import { PetitionAccess } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("contact_id").nullable().alter();
  });
  await knex.raw(/* sql */ `
  alter table petition_access drop constraint petition_access__petition_id_contact_id;
  create unique index petition_access__petition_id_contact_id on petition_access (petition_id, contact_id) where status = 'ACTIVE';
  create unique index petition_access__petition_id_contactless on petition_access (petition_id) where status = 'ACTIVE' and contact_id is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  const petitionAccessContactless = await knex
    .from("petition_access")
    .whereNull("contact_id")
    .select();

  const duplicates = (await knex
    .select("a.*")
    .from("petition_access as a")
    .leftJoin("petition_access as b", function () {
      this.on("a.id", "<", "b.id")
        .andOnNotNull("a.contact_id")
        .andOn("a.contact_id ", "=", "b.contact_id");
    })
    .where("a.status", "INACTIVE")) as PetitionAccess[];

  const petitionAccessIds = [...petitionAccessContactless, ...duplicates].map((pa) => pa.id);

  if (petitionAccessIds.length) {
    await knex
      .from("contact_authentication_request")
      .whereIn("petition_access_id", petitionAccessIds)
      .delete();

    await knex
      .from("petition_field_reply")
      .whereIn("petition_access_id", petitionAccessIds)
      .delete();

    await knex
      .from("petition_field_comment")
      .whereIn("petition_access_id", petitionAccessIds)
      .delete();

    await knex.from("petition_message").whereIn("petition_access_id", petitionAccessIds).delete();

    await knex
      .from("petition_event")
      .whereIn(knex.raw("(data ->> 'petition_access_id')::int") as any, petitionAccessIds)
      .delete();

    await knex.from("petition_access").whereIn("id", petitionAccessIds).delete();
  }

  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("contact_id").notNullable().alter();
  });

  await knex.raw(/* sql */ `
  drop index petition_access__petition_id_contactless;
  drop index petition_access__petition_id_contact_id;
  alter table petition_access add constraint petition_access__petition_id_contact_id unique (petition_id, contact_id);
`);
}
