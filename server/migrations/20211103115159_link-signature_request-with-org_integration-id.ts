import { Knex } from "knex";
import pMap from "p-map";
import { omit } from "remeda";
import { PetitionSignatureRequest, OrgIntegration, Petition } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  const [petitions, signatureRequests, signatureIntegrations] = await Promise.all([
    knex.from<Petition>("petition").select("*"),
    knex.from<PetitionSignatureRequest>("petition_signature_request").select("*"),
    knex.from<OrgIntegration>("org_integration").where("type", "SIGNATURE").select("*"),
  ]);

  await pMap(
    signatureRequests,
    async (s) => {
      const orgId = petitions.find((p) => p.id === s.petition_id)?.org_id;
      if (!orgId) {
        throw new Error();
      }
      const orgIntegrationId = signatureIntegrations.find(
        (i) => i.org_id === orgId && i.provider === s.signature_config.provider
      )?.id;
      if (!orgIntegrationId) {
        throw new Error();
      }

      await knex
        .from<PetitionSignatureRequest>("petition_signature_request")
        .where("id", s.id)
        .update(
          "signature_config",
          JSON.stringify({
            ...omit(s.signature_config, ["provider"]),
            orgIntegrationId,
          })
        );
    },
    { concurrency: 1 }
  );

  await pMap(
    petitions.filter((p) => !!p.signature_config),
    async (p) => {
      const orgIntegrationId = signatureIntegrations.find(
        (i) => i.org_id === p.org_id && i.provider === p.signature_config.provider
      )?.id;
      if (orgIntegrationId === undefined) {
        throw new Error();
      }

      await knex
        .from<Petition>("petition")
        .where("id", p.id)
        .whereNotNull("signature_config")
        .update(
          "signature_config",
          JSON.stringify({
            ...omit(p.signature_config, ["provider"]),
            orgIntegrationId,
          })
        );
    },
    { concurrency: 1 }
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
        throw new Error();
      }
      await knex
        .from<PetitionSignatureRequest>("petition_signature_request")
        .where("id", s.id)
        .update("signature_config", {
          ...omit(s.signature_config, ["orgIntegrationId"]),
          provider,
        });
    },
    { concurrency: 1 }
  );

  await pMap(
    petitions,
    async (p) => {
      const provider = signatureIntegrations.find(
        (i) => i.id === p.signature_config.orgIntegrationId
      )?.provider;
      if (!provider) {
        throw new Error();
      }
      await knex
        .from<Petition>("petition")
        .where("id", p.id)
        .update(
          "signature_config",
          JSON.stringify({
            ...omit(p.signature_config, ["orgIntegrationId"]),
            provider,
          })
        );
    },
    { concurrency: 1 }
  );
}
