import { Knex } from "knex";
import pMap from "p-map";
import { OrgIntegration, Petition, PetitionSignatureRequest } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  const signatureRequests = await knex
    .from<PetitionSignatureRequest>("petition_signature_request")
    .select("*");

  const signatureIntegrations = await knex
    .from<OrgIntegration>("org_integration")
    .where("type", "SIGNATURE")
    .select("*");

  const { rows: _petitions } = await knex.raw<{
    rows: Pick<Petition, "id" | "org_id">[];
  }>(/* sql */ `
    select distinct p.id, p.org_id from petition p where p.id in (
      select distinct psr.petition_id from petition_signature_request psr
    )
  `);
  const orgIdsbyPetitionId = Object.fromEntries(_petitions.map((x) => [x.id, x.org_id]));
  let processed = 0;

  await pMap(
    signatureRequests,
    async (s) => {
      console.log(`processing ${processed++}/${signatureRequests.length}`);
      const orgId = orgIdsbyPetitionId[s.petition_id];
      if (!orgId) {
        throw new Error();
      }
      const orgIntegrationId = signatureIntegrations.find(
        (i) => i.org_id === orgId && i.provider === s.signature_config.provider
      )?.id;
      if (!orgIntegrationId) {
        throw new Error();
      }

      await knex.raw(
        /* sql */ `
        update petition_signature_request
        set signature_config = jsonb_set(signature_config - 'provider', '{orgIntegrationId}', ?::jsonb)
        where id = ?
      `,
        [`${orgIntegrationId}`, s.id]
      );
    },
    { concurrency: 5 }
  );

  const petitions = await knex
    .from<Petition>("petition")
    .whereNotNull("signature_config")
    .select("id", "org_id", "signature_config");
  processed = 0;
  await pMap(
    petitions,
    async (p) => {
      console.log(`processing ${processed++}/${petitions.length}`);
      const orgIntegrationId = signatureIntegrations.find(
        (i) => i.org_id === p.org_id && i.provider === p.signature_config.provider
      )?.id;
      if (orgIntegrationId === undefined) {
        throw new Error();
      }

      await knex.raw(
        /* sql */ `
        update petition
        set signature_config = jsonb_set(signature_config - 'provider', '{orgIntegrationId}', ?::jsonb)
        where id = ?
      `,
        [`${orgIntegrationId}`, p.id]
      );
    },
    { concurrency: 5 }
  );
}

export async function down(knex: Knex): Promise<void> {
  const [petitions, signatureRequests, signatureIntegrations] = await Promise.all([
    knex.from<Petition>("petition").whereNotNull("signature_config").select("*"),
    knex.from<PetitionSignatureRequest>("petition_signature_request").select("*"),
    knex.from<OrgIntegration>("org_integration").where("type", "SIGNATURE").select("*"),
  ]);

  await pMap(
    signatureRequests,
    async (s) => {
      const provider = signatureIntegrations.find(
        (i) => i.id === s.signature_config.orgIntegrationId
      )?.provider;
      if (!provider) {
        throw new Error(
          `PetitionSignatureRequest:${s.id} missing OrgIntegration:${s.signature_config.orgIntegrationId}`
        );
      }

      await knex.raw(
        /* sql */ `
        update petition_signature_request
        set signature_config = jsonb_set(signature_config - 'orgIntegrationId', '{provider}', to_jsonb(?::text))
        where id = ?
      `,
        [provider, s.id]
      );
    },
    { concurrency: 5 }
  );

  await pMap(
    petitions,
    async (p) => {
      const provider = signatureIntegrations.find(
        (i) => i.id === p.signature_config.orgIntegrationId
      )?.provider;
      if (!provider) {
        throw new Error(
          `Petition:${p.id} missing OrgIntegration:${p.signature_config.orgIntegrationId}`
        );
      }
      await knex.raw(
        /* sql */ `
        update petition
        set signature_config = jsonb_set(signature_config - 'orgIntegrationId', '{provider}', to_jsonb(?::text))
        where id = ?
      `,
        [provider, p.id]
      );
    },
    { concurrency: 5 }
  );
}
