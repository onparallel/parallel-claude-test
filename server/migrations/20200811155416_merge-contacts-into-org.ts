import * as Knex from "knex";
import pMap from "p-map";

type Contact = {
  id: number;
  email: string;
  org_id: number;
};

async function getDuplicatedContacts(
  t: Knex.Transaction<any, any>
): Promise<Contact[]> {
  const { rows: duplicatedContacts } = await t.raw<{
    rows: Contact[];
  }>(/* sql */ `
    SELECT min(id) as id, email, org_id
    FROM contact
    WHERE deleted_at IS NULL
    GROUP BY email, org_id
    HAVING count(id) > 1    
  `);

  return duplicatedContacts;
}

async function updateDoneBy(
  tableName: string,
  newValue: string,
  valuesToReplace: string[],
  t: Knex.Transaction<any, any>
) {
  return await Promise.all([
    t
      .from(tableName)
      .update({
        created_by: newValue,
      })
      .whereIn("created_by", valuesToReplace),
    t
      .from(tableName)
      .update({
        updated_by: newValue,
      })
      .whereIn("updated_by", valuesToReplace),
    t
      .from(tableName)
      .update({
        deleted_by: newValue,
      })
      .whereIn("deleted_by", valuesToReplace),
  ]);
}

function replaceContactId(t: Knex.Transaction<any, any>) {
  return async (contact: Contact) => {
    // get ids to be replaced with contact.id
    const { rows } = await t.raw<{ rows: { id: number }[] }>(
      /* sql */ `
        SELECT id 
        FROM contact 
        WHERE id != ? AND email = ? AND org_id = ?
      `,
      [contact.id, contact.email, contact.org_id]
    );

    const idsToReplace = rows.map((r) => r.id);

    // replace fields
    await Promise.all([
      t
        .from("petition_access")
        .update({
          contact_id: contact.id,
        })
        .whereIn("contact_id", idsToReplace),
      updateDoneBy(
        "petition_field_reply",
        `Contact:${contact.id}`,
        idsToReplace.flatMap((id) => [`Contact:${id}`, `Contact${id}`]), // some fields were being saved with bad format, so here it checks both and fixes it
        t
      ),
      updateDoneBy(
        "file_upload",
        `Contact:${contact.id}`,
        idsToReplace.map((id) => `Contact:${id}`),
        t
      ),
    ]);

    // delete duplicated contacts
    await t.from("contact").whereIn("id", idsToReplace).delete();
  };
}

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async (t) => {
    const duplicated = await getDuplicatedContacts(t);

    // merge and delete duplicated contacts
    await pMap(duplicated, replaceContactId(t), { concurrency: 10 });

    await t.schema.alterTable("contact", (t) => {
      // drop old index
      t.dropIndex(["email", "owner_id"], "contact__owner_id__email");
      // remove column contact.owner_id
      t.dropColumn("owner_id");
    });

    // add constraint on contact org_id,email
    await t.raw(/* sql */ `
      CREATE UNIQUE INDEX "contact__org_id__email" 
      ON "contact" ("org_id", "email")
      WHERE "deleted_at" IS NULL
    `);
  });
}

export async function down(knex: Knex): Promise<void> {}
