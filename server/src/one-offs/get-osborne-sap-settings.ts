import "./../init";
// keep this space to prevent import sorting removing init from top
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { fromInstanceMetadata } from "@aws-sdk/credential-providers";
import { Knex } from "knex";
import { isNonNullish, isNullish, pick } from "remeda";
import { assert } from "ts-essentials";
import yargs from "yargs";
import { createContainer } from "../container";
import { ProfileRelationshipType, ProfileType, ProfileTypeField } from "../db/__types";
import { KNEX } from "../db/knex";
import { getOsborneSapSettings } from "../integrations/profile-sync/sap/osborne";
import { SapProfileSyncIntegrationSettings } from "../integrations/profile-sync/sap/types";
import { loadEnv } from "../util/loadEnv";

function findProfileTypeById(id: number | undefined, options: ProfileType[], key: string) {
  let result = id;
  if (isNullish(result)) {
    if (options.length === 0) {
      throw new Error(`No ${key} found`);
    }
    if (options.length > 1) {
      throw new Error(
        `Multiple options found. Pick one and use --${key} to specify it. ${JSON.stringify(options.map(pick(["id", "name", "name_plural"])))}`,
      );
    }

    result = options[0].id;
  } else {
    const profileType = options.find((pt) => pt.id === id);
    if (isNullish(profileType)) {
      throw new Error(`${key} ${id} not found`);
    }
  }

  return result;
}

function findRelationshipTypeByAlias(
  alias: string,
  options: ProfileRelationshipType[],
  key: string,
) {
  const result = options.find((rt) => rt.alias === alias);
  if (isNullish(result)) {
    if (options.length === 0) {
      throw new Error(`No ${key} found`);
    }

    throw new Error(
      `No relationship found by alias ${alias}. Pick one and use --${key} to specify it. ${JSON.stringify(options.map(pick(["id", "alias"])))}`,
    );
  }

  return result.id;
}

function extractFieldIds<T extends { [key: string]: string }>(
  values: T,
  fields: ProfileTypeField[],
): { [K in keyof T]: number } {
  return Object.fromEntries(
    Object.entries(values).map(([key, alias]) => {
      const field = fields.find((f) => f.alias === alias);
      if (isNullish(field)) {
        throw new Error(`ProfileTypeField with alias '${alias}' not found`);
      }
      return [key, field.id];
    }),
  ) as { [K in keyof T]: number };
}

async function main() {
  const opts = await yargs
    .usage('Usage: NODE_ENV=production ENV=staging OSBORNE_CREDENTIALS="x:x" $0 --orgId [orgId]')
    .option("orgId", {
      required: true,
      type: "number",
      description: "Organization ID to get the SAP settings for.",
    })
    .option("individualProfileTypeId", {
      required: false,
      type: "number",
      description: "Individual profile type ID to get the SAP settings for.",
    })
    .option("legalEntityProfileTypeId", {
      required: false,
      type: "number",
      description: "Legal entity profile type ID to get the SAP settings for.",
    })
    .option("matterProfileTypeId", {
      required: false,
      type: "number",
      description: "Matter profile type ID to get the SAP settings for.",
    })
    .option("clientMatterRelationshipTypeAlias", {
      required: false,
      type: "string",
      description: "Client matter relationship type alias to get the SAP settings for.",
    }).argv;

  const orgId = opts.orgId;
  const {
    individualProfileTypeId,
    legalEntityProfileTypeId,
    matterProfileTypeId,
    clientMatterRelationshipTypeAlias,
  } = opts;

  await loadEnv();
  const container = createContainer();
  const knex = container.get<Knex>(KNEX);

  const secretsManager = new SecretsManagerClient({
    credentials: fromInstanceMetadata({
      maxRetries: 3,
      timeout: 3_000,
    }),
    region: process.env.AWS_REGION!,
  });
  const response = await secretsManager.send(
    new GetSecretValueCommand({
      SecretId: "arn:aws:secretsmanager:eu-central-1:749273139513:secret:ops/certificate-EnGjo7",
    }),
  );
  assert(isNonNullish(response.SecretString));
  const secret = JSON.parse(response.SecretString) as { passphrase: string; pfx: string };

  const [organization] = await knex
    .from("organization")
    .whereNull("deleted_at")
    .where("id", orgId)
    .select("*");

  console.log(`Getting SAP settings for organization: ${organization.name} (${orgId})`);

  const profileTypes = await knex
    .from("profile_type")
    .where({
      deleted_at: null,
      archived_at: null,
      org_id: orgId,
    })
    .select("*");

  const relationshipTypes = await knex
    .from("profile_relationship_type")
    .where({
      deleted_at: null,
      org_id: orgId,
    })
    .select("*");

  const nonStandardProfileTypes = profileTypes.filter((pt) => pt.standard_type === null);
  const individualProfileTypes = profileTypes.filter((pt) => pt.standard_type === "INDIVIDUAL");
  const legalEntityProfileTypes = profileTypes.filter((pt) => pt.standard_type === "LEGAL_ENTITY");
  const matterProfileTypes = profileTypes.filter((pt) => pt.standard_type === "MATTER");

  const individualPT = findProfileTypeById(
    individualProfileTypeId,
    individualProfileTypes,
    "individualProfileTypeId",
  );

  const legalEntityPT = findProfileTypeById(
    legalEntityProfileTypeId,
    legalEntityProfileTypes,
    "legalEntityProfileTypeId",
  );

  const matterPT = findProfileTypeById(
    matterProfileTypeId,
    [...matterProfileTypes, ...nonStandardProfileTypes],
    "matterProfileTypeId",
  );

  const individualFields = await knex
    .from("profile_type_field")
    .where("profile_type_id", individualPT)
    .whereNull("deleted_at")
    .whereNotNull("alias")
    .select("*");

  const legalEntityFields = await knex
    .from("profile_type_field")
    .where("profile_type_id", legalEntityPT)
    .whereNull("deleted_at")
    .whereNotNull("alias")
    .select("*");

  const matterFields = await knex
    .from("profile_type_field")
    .where("profile_type_id", matterPT)
    .whereNull("deleted_at")
    .whereNotNull("alias")
    .select("*");

  const settings: SapProfileSyncIntegrationSettings = {
    ...getOsborneSapSettings({
      individualProfileTypeId: individualPT,
      individualProfileTypeFieldIds: extractFieldIds(
        {
          name: "full_name",
          email: "p_email",
          phone: "p_phone_number",
          externalId: "external_id",
          relationship: "p_relationship",
          addressId: "p_address",
          clientPartner: "client_partner",
          clientPartnerText: "client_partner_text",
          clientStatus: "oc_client_status",
          city: "p_city",
          postalCode: "p_zip",
          country: "p_country_of_residence",
          taxNumber: "p_tax_id",
          isNewClient: "is_new_client",
          nonFaceToFaceCustomer: "non_face_to_face_customer",
          language: "language",
          activity: "activity",
          kycRefreshDate: "kyc_refresh_date",
          kycStartDate: "kyc_start_date",
          prescoringRisk: "prescoring_risk",
          globalRisk: "global_risk",
          risk: "p_risk",
        },
        individualFields,
      ),
      legalEntityProfileTypeId: legalEntityPT,
      legalEntityProfileTypeFieldIds: extractFieldIds(
        {
          activity: "activity",
          addressId: "p_registered_address",
          city: "p_city",
          clientPartner: "client_partner",
          clientPartnerText: "client_partner_text",
          clientStatus: "oc_client_status",
          country: "p_country",
          email: "email",
          externalId: "external_id",
          globalRisk: "global_risk",
          isNewClient: "is_new_client",
          kycRefreshDate: "kyc_refresh_date",
          kycStartDate: "kyc_start_date",
          language: "language",
          name: "p_entity_name",
          nonFaceToFaceCustomer: "non_face_to_face_customer",
          phone: "p_phone_number",
          postalCode: "p_zip",
          prescoringRisk: "prescoring_risk",
          relationship: "p_relationship",
          risk: "p_risk",
          taxNumber: "p_tax_id",
          entityType: "p_entity_type",
        },
        legalEntityFields,
      ),
      matterProfileTypeId: matterPT,
      matterProfileTypeFieldIds: extractFieldIds(
        {
          amlSubjectMatters: "aml_subject_matters",
          countriesInvolved: "p_countries_involved",
          matterDescription: "p_matter_description",
          matterName: "p_matter_name",
          matterRisk: "p_matter_risk",
          matterStatus: "matter_status",
          matterSupervisor: "matter_supervisor",
          matterSupervisorText: "matter_supervisor_text",
          practiceGroup: "practice_group",
          projectId: "p_matter_id",
          subpracticeGroup: "subpractice_group",
          tempActiveUntil: "temp_active_until",
          transactionVolume: "transaction_volume",
        },
        matterFields,
      ),
      clientMatterRelationshipTypeId: findRelationshipTypeByAlias(
        clientMatterRelationshipTypeAlias ?? "p_client__matter",
        relationshipTypes,
        "clientMatterRelationshipTypeAlias",
      ),
      ...(process.env.ENV === "staging"
        ? {
            projectFilter: {
              operator: "and",
              conditions: [
                {
                  left: { type: "property", name: "CreatedOn" },
                  operator: "ge",
                  right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
                },
              ],
            },
          }
        : {}),
    }),
    authorization: {
      type: "CERTIFICATE",
      ...secret,
    },
  };

  console.log(JSON.stringify(settings));
}

main().then(() => {
  process.exit(0);
});
