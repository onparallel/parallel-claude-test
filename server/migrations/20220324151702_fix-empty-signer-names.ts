import { Knex } from "knex";
import { indexBy, isDefined, uniq } from "remeda";

type SignatureConfig = {
  signersInfo: {
    contactId?: number;
    firstName?: string;
    lastName?: string;
  }[];
};

export async function up(knex: Knex): Promise<void> {
  const { rows } = await knex.raw<{
    rows: { id: number; signature_config: SignatureConfig }[];
  }>(/* sql */ `
        select distinct(id), "signature_config" from 
        petition_signature_request psr,
        jsonb_array_elements("signature_config"->'signersInfo') as signer
        where signer->>'firstName' = '' and signer->>'lastName' = '';
    `);

  const contactIds = uniq(
    rows.flatMap((r) =>
      r.signature_config.signersInfo
        .filter((i) => i.contactId !== undefined && i.firstName === "" && i.lastName === "")
        .map((i) => i.contactId)
    ) as number[]
  );

  const contacts = await knex.from("contact").whereIn("id", contactIds).select("*");
  const contactsById = indexBy(contacts, (c) => c.id);

  const updates = rows.map((r) => {
    return {
      id: r.id,
      signature_config: {
        ...r.signature_config,
        signersInfo: r.signature_config.signersInfo.map((signer) => {
          if (
            signer.firstName === "" &&
            isDefined(signer.contactId) &&
            isDefined(contactsById[signer.contactId])
          ) {
            const contact = contactsById[signer.contactId];
            return contact
              ? {
                  ...signer,
                  firstName: contact.first_name,
                  lastName: contact.last_name,
                }
              : signer;
          }

          return signer;
        }),
      },
    };
  });

  if (updates.length > 0) {
    await knex.raw(
      /* sql */ `
  with updates as (
      SELECT * FROM (VALUES ${updates
        .map(() => "(?::int, ?::jsonb)")
        .join(", ")}) AS t (id,signature_config)
    )
    update petition_signature_request psr set signature_config = u.signature_config from updates u where psr.id = u.id
  `,
      updates.flatMap((u) => [u.id, JSON.stringify(u.signature_config)])
    );
  }
}

export async function down(knex: Knex): Promise<void> {}
