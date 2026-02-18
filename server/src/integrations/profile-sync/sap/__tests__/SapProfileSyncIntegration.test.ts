import { readFileSync } from "fs";
import { Container } from "inversify";
import { Knex } from "knex";
import { join } from "path";
import { indexBy, pick, range } from "remeda";
import { MockSapOdataClient } from "../../../../../test/mocks";
import { createTestContainer } from "../../../../../test/testContainer";
import { ILogger, LOGGER } from "../../../../services/Logger";

import {
  Organization,
  OrgIntegration,
  Profile,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../../../db/__types";
import { KNEX } from "../../../../db/knex";
import { Mocks } from "../../../../db/repositories/__tests__/mocks";
import {
  IIntegrationsSetupService,
  INTEGRATIONS_SETUP_SERVICE,
} from "../../../../services/IntegrationsSetupService";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
} from "../../../../services/ProfilesSetupService";
import { deleteAllData } from "../../../../util/knexUtils";
import { SAP_ODATA_CLIENT } from "../SapOdataClient";
import {
  SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
  SapProfileSyncIntegrationFactory,
} from "../SapProfileSyncIntegration";
import { SapEntityMapping } from "../types";

describe("SapProfileSyncIntegration", () => {
  let container: Container;
  let organization: Organization;
  let client: MockSapOdataClient;

  let legalEntity: ProfileType;
  let legalEntityFields: Record<string, ProfileTypeField>;

  let individual: ProfileType;
  let individualFields: Record<string, ProfileTypeField>;

  let relationshipTypes: Record<string, ProfileRelationshipType>;

  let mocks: Mocks;
  let knex: Knex;

  let mcDonaldsUser: User;
  let pepsiUser: User;

  beforeAll(async () => {
    container = await createTestContainer();

    const noopLogger: ILogger = { log() {}, info() {}, warn() {}, error() {}, debug() {} };
    await container.unbind(LOGGER);
    container.bind<ILogger>(LOGGER).toConstantValue(noopLogger);

    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);

    client = container.get<MockSapOdataClient>(SAP_ODATA_CLIENT);

    const profilesSetup = container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);

    await profilesSetup.createDefaultProfileTypes(organization.id, "TEST");

    [legalEntity] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "LEGAL_ENTITY",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");

    await mocks.createRandomProfileTypeFields(organization.id, legalEntity.id, 1, () => ({
      type: "USER_ASSIGNMENT",
      alias: "assigned_user",
    }));

    const _legalEntityFields = await mocks.knex
      .from("profile_type_field")
      .where("profile_type_id", legalEntity.id)
      .whereNull("deleted_at")
      .select("*");

    legalEntityFields = indexBy(_legalEntityFields, (f) => f.alias!);

    await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: legalEntity.id,
        deleted_at: null,
        alias: "p_tax_id",
      })
      .update({
        is_unique: true,
      });

    [individual] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "INDIVIDUAL",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");

    const _individualFields = await mocks.knex
      .from("profile_type_field")
      .where("profile_type_id", individual.id)
      .whereNull("deleted_at")
      .select("*");

    individualFields = indexBy(_individualFields, (f) => f.alias!);

    await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: individual.id,
        deleted_at: null,
        alias: "p_tax_id",
      })
      .update({
        is_unique: true,
      });

    const _relationshipTypes = await mocks.knex
      .from("profile_relationship_type")
      .where({ org_id: organization.id, deleted_at: null })
      .select("*");
    relationshipTypes = indexBy(_relationshipTypes, (r) => r.alias!);

    [mcDonaldsUser, pepsiUser] = await mocks.createRandomUsers(
      organization.id,
      2,
      undefined,
      (i) => ({
        email: [`mcdonalds@onparallel.com`, `pepsi@onparallel.com`][i],
      }),
    );
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  function getIntegration(integrationId: number) {
    const integrationFactory = container.get<SapProfileSyncIntegrationFactory>(
      SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
    );
    return integrationFactory(integrationId);
  }

  async function createSapIntegration(mappings: SapEntityMapping[]) {
    await mocks.knex.from("org_integration").update({ deleted_at: null });

    return await container
      .get<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE)
      .createSapProfileSyncIntegration(
        {
          org_id: organization.id,
          name: "SAP",
          settings: {
            baseUrl: "https://test.com",
            mappings,
            CREDENTIALS: {
              type: "BASIC",
              user: "XXX",
              password: "XXX",
            },
          },
        },
        "TEST",
      );
  }

  describe("initialSync", () => {
    afterEach(async () => {
      await mocks.knex.from("profile").update({ deleted_at: new Date() });
      await mocks.knex.from("profile_relationship").update({ deleted_at: new Date() });
      await mocks.knex.from("profile_field_value").update({ deleted_at: new Date() });
    });

    it("with simple mapping and no relationships", async () => {
      client.setNextExpectedCalls([
        [
          "getMetadata",
          ["sap/API_BUSINESS_PARTNER"],
          readFileSync(
            join(__dirname, `./odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`),
            "utf-8",
          ),
        ],
      ]);

      const orgIntegration = await createSapIntegration([
        {
          name: "BusinessPartner to Legal Entity",
          entityDefinition: {
            servicePath: "sap/API_BUSINESS_PARTNER",
            serviceNamespace: "API_BUSINESS_PARTNER",
            entitySetName: "A_BusinessPartner",
            remoteEntityKey: ["BusinessPartner"],
          },
          profileTypeId: legalEntity.id,
          remoteEntityKeyBinding: {
            profileTypeFieldIds: [legalEntityFields["p_tax_id"].id],
          },

          initialSyncOrderBy: [
            ["CreationDate", "asc"],
            ["CreationTime", "asc"],
            ["BusinessPartnerUUID", "asc"],
          ],
          changeDetection: {
            type: "POLLING",
            remoteLastChange: {
              type: "DATETIME_TIME",
              fields: ["LastChangeDate", "LastChangeTime"],
            },
          },
          localIdBinding: { remoteEntityFields: ["YY1_bp_id_Parallel_bus"] },
          fieldMappings: [
            {
              remoteEntityFields: ["OrganizationBPName1"],
              profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
              direction: "TO_LOCAL",
            },
            {
              remoteEntityFields: ["YY1_AMT_CLIENT_STATUS_bus"],
              profileTypeFieldIds: [legalEntityFields["p_client_status"].id],
              direction: "BOTH",
              toLocalTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "01", to: "ACTIVE" }, // Active (01)
                    { from: "03", to: "CANCELLED" }, // Locked (03)
                    { from: "04", to: "REJECTED" }, // Rejected (04)
                    { from: "08", to: "CLOSED" }, // Closed (08)
                  ],
                },
              ],
              toRemoteTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "ACTIVE", to: "01" }, // Active (01)
                    { from: "CANCELLED", to: "03" }, // Locked (03)
                    { from: "REJECTED", to: "04" }, // Rejected (04)
                    { from: "CLOSED", to: "08" }, // Closed (08)
                  ],
                },
              ],
            },
          ],
        },
      ]);

      client.assertNoMoreCalls();

      const sap = getIntegration(orgIntegration.id);

      client.setNextExpectedCalls([
        [
          "getEntitySet",
          [
            {
              servicePath: "sap/API_BUSINESS_PARTNER",
              serviceNamespace: "API_BUSINESS_PARTNER",
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
            },
            {
              $orderby: [
                ["CreationDate", "asc"],
                ["CreationTime", "asc"],
                ["BusinessPartnerUUID", "asc"],
              ],
              $select: [
                "BusinessPartner",
                "YY1_bp_id_Parallel_bus",
                "OrganizationBPName1",
                "YY1_AMT_CLIENT_STATUS_bus",
              ],
            },
          ],
          {
            results: [
              {
                BusinessPartner: "1",
                OrganizationBPName1: "McDonalds",
                YY1_AMT_CLIENT_STATUS_bus: "01",
              },
              {
                BusinessPartner: "2",
                OrganizationBPName1: "Pepsi",
                YY1_AMT_CLIENT_STATUS_bus: "04",
              },
              {
                BusinessPartner: "3",
                OrganizationBPName1: "Coca-Cola",
                YY1_AMT_CLIENT_STATUS_bus: "08",
              },
            ],
          },
        ],
        [
          "updateEntity",
          [
            {
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
              serviceNamespace: "API_BUSINESS_PARTNER",
              servicePath: "sap/API_BUSINESS_PARTNER",
            },
            { BusinessPartner: "1" },
            { YY1_bp_id_Parallel_bus: /[A-Za-z0-9]+/i },
          ],
          null,
        ],
        [
          "updateEntity",
          [
            {
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
              serviceNamespace: "API_BUSINESS_PARTNER",
              servicePath: "sap/API_BUSINESS_PARTNER",
            },
            { BusinessPartner: "2" },
            { YY1_bp_id_Parallel_bus: /[A-Za-z0-9]+/i },
          ],
          null,
        ],
        [
          "updateEntity",
          [
            {
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
              serviceNamespace: "API_BUSINESS_PARTNER",
              servicePath: "sap/API_BUSINESS_PARTNER",
            },
            { BusinessPartner: "3" },
            { YY1_bp_id_Parallel_bus: /[A-Za-z0-9]+/i },
          ],
          null,
        ],
      ]);

      await sap.initialSync();
      client.assertNoMoreCalls();

      const profiles = await mocks.knex
        .from("profile")
        .where({ org_id: organization.id, profile_type_id: legalEntity.id, deleted_at: null })
        .orderBy("created_at", "asc")
        .select("*");

      expect(profiles).toHaveLength(3);

      const profileFieldValues = await mocks.knex
        .from("profile_field_value")
        .whereIn(
          "profile_id",
          profiles.map((p) => p.id),
        )
        .where({ deleted_at: null, removed_at: null, anonymized_at: null });
      expect(profileFieldValues).toHaveLength(3 * 3);

      const mcDonaldsProfileId = profileFieldValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "1",
      )?.profile_id;
      expect(mcDonaldsProfileId).toBeDefined();
      const pepsiProfileId = profileFieldValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "2",
      )?.profile_id;
      expect(pepsiProfileId).toBeDefined();
      const cocaColaProfileId = profileFieldValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "3",
      )?.profile_id;
      expect(cocaColaProfileId).toBeDefined();

      expect(
        profileFieldValues.map(pick(["profile_id", "profile_type_field_id", "type", "content"])),
      ).toIncludeSameMembers([
        {
          profile_id: mcDonaldsProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "1" }),
        },
        {
          profile_id: mcDonaldsProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "McDonalds" }),
        },
        {
          profile_id: mcDonaldsProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "ACTIVE" }),
        },
        {
          profile_id: pepsiProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "2" }),
        },
        {
          profile_id: pepsiProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Pepsi" }),
        },
        {
          profile_id: pepsiProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "REJECTED" }),
        },
        {
          profile_id: cocaColaProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "3" }),
        },
        {
          profile_id: cocaColaProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Coca-Cola" }),
        },
        {
          profile_id: cocaColaProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "CLOSED" }),
        },
      ]);
    });

    it("with some field mappings and EMBED_INTO_PARENT relationship", async () => {
      client.setNextExpectedCalls([
        [
          "getMetadata",
          ["sap/API_BUSINESS_PARTNER"],
          readFileSync(
            join(__dirname, `./odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`),
            "utf-8",
          ),
        ],
      ]);

      const orgIntegration = await createSapIntegration([
        {
          name: "BusinessPartner to Legal Entity",
          entityDefinition: {
            servicePath: "sap/API_BUSINESS_PARTNER",
            serviceNamespace: "API_BUSINESS_PARTNER",
            entitySetName: "A_BusinessPartner",
            remoteEntityKey: ["BusinessPartner"],
          },
          profileTypeId: legalEntity.id,
          remoteEntityKeyBinding: {
            profileTypeFieldIds: [legalEntityFields["p_tax_id"].id],
          },
          initialSyncOrderBy: [
            ["CreationDate", "asc"],
            ["CreationTime", "asc"],
            ["BusinessPartnerUUID", "asc"],
          ],
          changeDetection: {
            type: "POLLING",
            remoteLastChange: {
              type: "DATETIME_TIME",
              fields: ["LastChangeDate", "LastChangeTime"],
            },
          },
          fieldMappings: [
            {
              remoteEntityFields: ["OrganizationBPName1"],
              profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
              direction: "TO_LOCAL",
            },
            {
              remoteEntityFields: ["YY1_AMT_CLIENT_STATUS_bus"],
              profileTypeFieldIds: [legalEntityFields["p_client_status"].id],
              direction: "BOTH",
              toLocalTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "01", to: "ACTIVE" }, // Active (01)
                    { from: "03", to: "CANCELLED" }, // Locked (03)
                    { from: "04", to: "REJECTED" }, // Rejected (04)
                    { from: "08", to: "CLOSED" }, // Closed (08)
                  ],
                },
              ],
              toRemoteTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "ACTIVE", to: "01" }, // Active (01)
                    { from: "CANCELLED", to: "03" }, // Locked (03)
                    { from: "REJECTED", to: "04" }, // Rejected (04)
                    { from: "CLOSED", to: "08" }, // Closed (08)
                  ],
                },
              ],
            },
          ],
          relationshipMappings: [
            {
              name: "to_BusinessPartnerAddress",
              syncStrategy: {
                type: "EMBED_INTO_PARENT",
                fieldMappings: [
                  {
                    remoteEntityFields: ["StreetName"],
                    profileTypeFieldIds: [legalEntityFields["p_registered_address"].id],
                    direction: "BOTH",
                  },
                  {
                    remoteEntityFields: ["CityName"],
                    profileTypeFieldIds: [legalEntityFields["p_city"].id],
                    direction: "BOTH",
                  },
                  {
                    remoteEntityFields: ["PostalCode"],
                    profileTypeFieldIds: [legalEntityFields["p_zip"].id],
                    direction: "BOTH",
                  },
                  {
                    remoteEntityFields: ["Country"],
                    profileTypeFieldIds: [legalEntityFields["p_country"].id],
                    direction: "BOTH",
                  },
                ],
              },
              fetchStrategy: {
                type: "FROM_NAVIGATION_PROPERTY",
                expectedCardinality: "MANY",
                navigationProperty: "to_BusinessPartnerAddress",
                entityDefinition: {
                  servicePath: "sap/API_BUSINESS_PARTNER",
                  serviceNamespace: "API_BUSINESS_PARTNER",
                  entitySetName: "A_BusinessPartnerAddress",
                  remoteEntityKey: ["BusinessPartner", "AddressID"],
                },
              },
            },
          ],
        },
      ]);

      client.assertNoMoreCalls();

      const sap = getIntegration(orgIntegration.id);

      client.setNextExpectedCalls([
        [
          "getEntitySet",
          [
            {
              servicePath: "sap/API_BUSINESS_PARTNER",
              serviceNamespace: "API_BUSINESS_PARTNER",
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
            },
            {
              $orderby: [
                ["CreationDate", "asc"],
                ["CreationTime", "asc"],
                ["BusinessPartnerUUID", "asc"],
              ],
              $select: [
                "BusinessPartner",
                "OrganizationBPName1",
                "YY1_AMT_CLIENT_STATUS_bus",
                "to_BusinessPartnerAddress/BusinessPartner",
                "to_BusinessPartnerAddress/AddressID",
                "to_BusinessPartnerAddress/StreetName",
                "to_BusinessPartnerAddress/CityName",
                "to_BusinessPartnerAddress/PostalCode",
                "to_BusinessPartnerAddress/Country",
              ],
              $expand: ["to_BusinessPartnerAddress"],
            },
          ],
          {
            results: [
              {
                BusinessPartner: "1",
                OrganizationBPName1: "McDonalds",
                YY1_AMT_CLIENT_STATUS_bus: "01",
                to_BusinessPartnerAddress: {
                  results: [
                    {
                      BusinessPartner: "1",
                      AddressID: "1",
                      StreetName: "123 Main St",
                      CityName: "New York",
                      PostalCode: "10001",
                      Country: "US",
                    },
                  ],
                },
              },
              {
                BusinessPartner: "2",
                OrganizationBPName1: "Pepsi",
                YY1_AMT_CLIENT_STATUS_bus: "04",
                to_BusinessPartnerAddress: {
                  results: [
                    {
                      BusinessPartner: "2",
                      AddressID: "2",
                      StreetName: "456 Main St",
                      CityName: "Los Angeles",
                      PostalCode: "90001",
                      Country: "US",
                    },
                  ],
                },
              },
              {
                BusinessPartner: "3",
                OrganizationBPName1: "Coca-Cola",
                YY1_AMT_CLIENT_STATUS_bus: "08",
                to_BusinessPartnerAddress: {
                  results: [
                    {
                      BusinessPartner: "3",
                      AddressID: "3",
                      StreetName: "789 Main St",
                      CityName: "Chicago",
                      PostalCode: "60601",
                      Country: "US",
                    },
                  ],
                },
              },
            ],
          },
        ],
      ]);

      await sap.initialSync();

      client.assertNoMoreCalls();

      const profiles = await mocks.knex
        .from("profile")
        .where({ org_id: organization.id, profile_type_id: legalEntity.id, deleted_at: null })
        .orderBy("created_at", "asc")
        .select("*");

      expect(profiles).toHaveLength(3);

      const profileFieldValues = await mocks.knex
        .from("profile_field_value")
        .whereIn(
          "profile_id",
          profiles.map((p) => p.id),
        )
        .where({ deleted_at: null, removed_at: null, anonymized_at: null });
      expect(profileFieldValues).toHaveLength(3 * 7);

      const mcDonaldsPFProfileId = profileFieldValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "1",
      )?.profile_id;
      expect(mcDonaldsPFProfileId).toBeDefined();
      const pepsiPFProfileId = profileFieldValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "2",
      )?.profile_id;
      expect(pepsiPFProfileId).toBeDefined();
      const cocaColaPFProfileId = profileFieldValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "3",
      )?.profile_id;
      expect(cocaColaPFProfileId).toBeDefined();

      expect(
        profileFieldValues.map(pick(["profile_id", "profile_type_field_id", "type", "content"])),
      ).toIncludeSameMembers([
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "1" }),
        },
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "McDonalds" }),
        },
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "ACTIVE" }),
        },
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: legalEntityFields["p_registered_address"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "123 Main St" }),
        },
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: legalEntityFields["p_city"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "New York" }),
        },
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: legalEntityFields["p_zip"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "10001" }),
        },
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: legalEntityFields["p_country"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "US" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "2" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Pepsi" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "REJECTED" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: legalEntityFields["p_registered_address"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "456 Main St" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: legalEntityFields["p_city"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Los Angeles" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: legalEntityFields["p_zip"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "90001" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: legalEntityFields["p_country"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "US" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "3" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Coca-Cola" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "CLOSED" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: legalEntityFields["p_registered_address"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "789 Main St" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: legalEntityFields["p_city"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Chicago" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: legalEntityFields["p_zip"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "60601" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: legalEntityFields["p_country"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "US" }),
        },
      ]);
    });

    it("with some field mappings and REPLICATE_RELATIONSHIP relationship", async () => {
      client.setNextExpectedCalls([
        [
          "getMetadata",
          ["sap/API_BUSINESS_PARTNER"],
          readFileSync(
            join(__dirname, `./odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`),
            "utf-8",
          ),
        ],
      ]);

      const orgIntegration = await createSapIntegration([
        {
          name: "BusinessPartner to Legal Entity",
          entityDefinition: {
            servicePath: "sap/API_BUSINESS_PARTNER",
            serviceNamespace: "API_BUSINESS_PARTNER",
            entitySetName: "A_BusinessPartner",
            remoteEntityKey: ["BusinessPartner"],
          },
          profileTypeId: legalEntity.id,
          remoteEntityKeyBinding: {
            profileTypeFieldIds: [legalEntityFields["p_tax_id"].id],
          },
          initialSyncOrderBy: [
            ["CreationDate", "asc"],
            ["CreationTime", "asc"],
            ["BusinessPartnerUUID", "asc"],
          ],
          changeDetection: {
            type: "POLLING",
            remoteLastChange: {
              type: "DATETIME_TIME",
              fields: ["LastChangeDate", "LastChangeTime"],
            },
          },
          fieldMappings: [
            {
              remoteEntityFields: ["OrganizationBPName1"],
              profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
              direction: "TO_LOCAL",
            },
            {
              remoteEntityFields: ["YY1_AMT_CLIENT_STATUS_bus"],
              profileTypeFieldIds: [legalEntityFields["p_client_status"].id],
              direction: "BOTH",
              toLocalTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "01", to: "ACTIVE" }, // Active (01)
                    { from: "03", to: "CANCELLED" }, // Locked (03)
                    { from: "04", to: "REJECTED" }, // Rejected (04)
                    { from: "08", to: "CLOSED" }, // Closed (08)
                  ],
                },
              ],
              toRemoteTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "ACTIVE", to: "01" }, // Active (01)
                    { from: "CANCELLED", to: "03" }, // Locked (03)
                    { from: "REJECTED", to: "04" }, // Rejected (04)
                    { from: "CLOSED", to: "08" }, // Closed (08)
                  ],
                },
              ],
            },
            {
              remoteEntityFields: ["BusinessPartnerCategory"],
              profileTypeFieldIds: [legalEntityFields["assigned_user"].id],
              direction: "BOTH",
            },
          ],
          relationshipMappings: [
            {
              name: "to_BusinessPartnerAddress",
              syncStrategy: {
                type: "REPLICATE_RELATIONSHIP",
                entityMappingIndex: 1,
                profileRelationshipTypeId:
                  relationshipTypes["p_legal_representative__legally_represented"].id,
                parentProfileRelationshipSide: "LEFT",
                missingRemoteRelationshipStrategy: "IGNORE",
              },
              fetchStrategy: {
                type: "FROM_NAVIGATION_PROPERTY",
                expectedCardinality: "ONE",
                navigationProperty: "to_Customer",
                entityDefinition: {
                  servicePath: "sap/API_BUSINESS_PARTNER",
                  serviceNamespace: "API_BUSINESS_PARTNER",
                  entitySetName: "A_Customer",
                  remoteEntityKey: ["Customer"],
                },
              },
            },
          ],
        },
        {
          name: "Customer to Individual",
          entityDefinition: {
            servicePath: "sap/API_BUSINESS_PARTNER",
            serviceNamespace: "API_BUSINESS_PARTNER",
            entitySetName: "A_Customer",
            remoteEntityKey: ["Customer"],
          },
          profileTypeId: individual.id,
          remoteEntityKeyBinding: {
            profileTypeFieldIds: [individualFields["p_tax_id"].id],
          },
          initialSyncOrderBy: [["CreationDate", "asc"]],
          changeDetection: {
            type: "POLLING",
            remoteLastChange: {
              type: "DATETIME",
              field: "CreationDate",
            },
          },
          fieldMappings: [
            {
              remoteEntityFields: ["Customer"],
              profileTypeFieldIds: [individualFields["p_tax_id"].id],
              direction: "TO_LOCAL",
            },
            {
              remoteEntityFields: ["CustomerName"],
              profileTypeFieldIds: [individualFields["p_first_name"].id],
              direction: "TO_LOCAL",
            },
          ],
        },
      ]);

      client.assertNoMoreCalls();

      const sap = getIntegration(orgIntegration.id);

      client.setNextExpectedCalls([
        [
          "getEntitySet",
          [
            {
              servicePath: "sap/API_BUSINESS_PARTNER",
              serviceNamespace: "API_BUSINESS_PARTNER",
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
            },
            {
              $orderby: [
                ["CreationDate", "asc"],
                ["CreationTime", "asc"],
                ["BusinessPartnerUUID", "asc"],
              ],
              $select: [
                "BusinessPartner",
                "OrganizationBPName1",
                "YY1_AMT_CLIENT_STATUS_bus",
                "BusinessPartnerCategory",
                "to_Customer/Customer",
                "to_Customer/CustomerName",
              ],
              $expand: ["to_Customer"],
            },
          ],
          {
            results: [
              {
                BusinessPartner: "1",
                OrganizationBPName1: "McDonalds",
                BusinessPartnerCategory: "mcdonalds@onparallel.com",
                YY1_AMT_CLIENT_STATUS_bus: "01",
                to_Customer: {
                  Customer: "MC_DONALDS",
                  CustomerName: "Mr. Donalds",
                },
              },
              {
                BusinessPartner: "2",
                OrganizationBPName1: "Pepsi",
                BusinessPartnerCategory: "pepsi@onparallel.com",
                YY1_AMT_CLIENT_STATUS_bus: "04",
                to_Customer: {
                  Customer: "PEPSI",
                  CustomerName: "Mr. Pepsi",
                },
              },
              {
                BusinessPartner: "3",
                OrganizationBPName1: "Coca-Cola",
                BusinessPartnerCategory: "cola@onparallel.com",
                YY1_AMT_CLIENT_STATUS_bus: "08",
                to_Customer: {
                  Customer: "COCA_COLA",
                  CustomerName: "Mr. Cola.",
                },
              },
            ],
          },
        ],
        [
          "getEntitySet",
          [
            {
              servicePath: "sap/API_BUSINESS_PARTNER",
              entitySetName: "A_Customer",
              remoteEntityKey: ["Customer"],
              serviceNamespace: "API_BUSINESS_PARTNER",
            },
            {
              $orderby: [["CreationDate", "asc"]],
              $select: ["Customer", "CustomerName"],
            },
          ],
          {
            results: [
              { Customer: "MC_DONALDS", CustomerName: "Mr. Donalds" },
              { Customer: "PEPSI", CustomerName: "Mr. Pepsi" },
              { Customer: "COCA_COLA", CustomerName: "Mr. Cola." },
              { Customer: "MENTOS", CustomerName: "Mr. Mentos." },
              { Customer: "OREOS", CustomerName: "Mr. Oreo." },
            ],
          },
        ],
      ]);

      await sap.initialSync();

      client.assertNoMoreCalls();

      const legalEntities = await mocks.knex
        .from("profile")
        .where({ org_id: organization.id, profile_type_id: legalEntity.id, deleted_at: null })
        .orderBy("created_at", "asc")
        .select("*");

      expect(legalEntities).toHaveLength(3);

      const legalEntityValues = await mocks.knex
        .from("profile_field_value")
        .whereIn(
          "profile_id",
          legalEntities.map((p) => p.id),
        )
        .where({ deleted_at: null, removed_at: null, anonymized_at: null });

      expect(legalEntityValues).toHaveLength(2 * 4 + 3);

      const mcDonaldsPJProfileId = legalEntityValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "1",
      )?.profile_id;
      expect(mcDonaldsPJProfileId).toBeDefined();
      const pepsiPJProfileId = legalEntityValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "2",
      )?.profile_id;
      expect(pepsiPJProfileId).toBeDefined();
      const cocaColaPJProfileId = legalEntityValues.find(
        (v) =>
          v.profile_type_field_id === legalEntityFields["p_tax_id"].id && v.content.value === "3",
      )?.profile_id;
      expect(cocaColaPJProfileId).toBeDefined();

      expect(
        legalEntityValues.map(pick(["profile_id", "profile_type_field_id", "type", "content"])),
      ).toIncludeSameMembers([
        {
          profile_id: mcDonaldsPJProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "1" }),
        },
        {
          profile_id: mcDonaldsPJProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "McDonalds" }),
        },
        {
          profile_id: mcDonaldsPJProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "ACTIVE" }),
        },
        {
          profile_id: mcDonaldsPJProfileId,
          profile_type_field_id: legalEntityFields["assigned_user"].id,
          type: "USER_ASSIGNMENT",
          content: expect.objectContaining({ value: mcDonaldsUser.id }),
        },
        {
          profile_id: pepsiPJProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "2" }),
        },
        {
          profile_id: pepsiPJProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Pepsi" }),
        },
        {
          profile_id: pepsiPJProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "REJECTED" }),
        },
        {
          profile_id: pepsiPJProfileId,
          profile_type_field_id: legalEntityFields["assigned_user"].id,
          type: "USER_ASSIGNMENT",
          content: expect.objectContaining({ value: pepsiUser.id }),
        },
        {
          profile_id: cocaColaPJProfileId,
          profile_type_field_id: legalEntityFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "3" }),
        },
        {
          profile_id: cocaColaPJProfileId,
          profile_type_field_id: legalEntityFields["p_entity_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Coca-Cola" }),
        },
        {
          profile_id: cocaColaPJProfileId,
          profile_type_field_id: legalEntityFields["p_client_status"].id,
          type: "SELECT",
          content: expect.objectContaining({ value: "CLOSED" }),
        },
      ]);

      const individuals = await mocks.knex
        .from("profile")
        .where({ org_id: organization.id, profile_type_id: individual.id, deleted_at: null })
        .orderBy("created_at", "asc")
        .select("*");

      expect(individuals).toHaveLength(5);

      const individualValues = await mocks.knex
        .from("profile_field_value")
        .whereIn(
          "profile_id",
          individuals.map((p) => p.id),
        )
        .where({ deleted_at: null, removed_at: null, anonymized_at: null });

      const mcDonaldsPFProfileId = individualValues.find(
        (v) =>
          v.profile_type_field_id === individualFields["p_tax_id"].id &&
          v.content.value === "MC_DONALDS",
      )?.profile_id;
      expect(mcDonaldsPFProfileId).toBeDefined();
      const pepsiPFProfileId = individualValues.find(
        (v) =>
          v.profile_type_field_id === individualFields["p_tax_id"].id &&
          v.content.value === "PEPSI",
      )?.profile_id;
      expect(pepsiPFProfileId).toBeDefined();
      const cocaColaPFProfileId = individualValues.find(
        (v) =>
          v.profile_type_field_id === individualFields["p_tax_id"].id &&
          v.content.value === "COCA_COLA",
      )?.profile_id;
      expect(cocaColaPFProfileId).toBeDefined();
      const mentosPFProfileId = individualValues.find(
        (v) =>
          v.profile_type_field_id === individualFields["p_tax_id"].id &&
          v.content.value === "MENTOS",
      )?.profile_id;
      expect(mentosPFProfileId).toBeDefined();
      const oreosPFProfileId = individualValues.find(
        (v) =>
          v.profile_type_field_id === individualFields["p_tax_id"].id &&
          v.content.value === "OREOS",
      )?.profile_id;
      expect(oreosPFProfileId).toBeDefined();

      expect(individualValues).toHaveLength(5 * 2);

      expect(
        individualValues.map(pick(["profile_id", "profile_type_field_id", "type", "content"])),
      ).toIncludeSameMembers([
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: individualFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "MC_DONALDS" }),
        },
        {
          profile_id: mcDonaldsPFProfileId,
          profile_type_field_id: individualFields["p_first_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Mr. Donalds" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: individualFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "PEPSI" }),
        },
        {
          profile_id: pepsiPFProfileId,
          profile_type_field_id: individualFields["p_first_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Mr. Pepsi" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: individualFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "COCA_COLA" }),
        },
        {
          profile_id: cocaColaPFProfileId,
          profile_type_field_id: individualFields["p_first_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Mr. Cola." }),
        },
        {
          profile_id: mentosPFProfileId,
          profile_type_field_id: individualFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "MENTOS" }),
        },
        {
          profile_id: mentosPFProfileId,
          profile_type_field_id: individualFields["p_first_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Mr. Mentos." }),
        },
        {
          profile_id: oreosPFProfileId,
          profile_type_field_id: individualFields["p_tax_id"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "OREOS" }),
        },
        {
          profile_id: oreosPFProfileId,
          profile_type_field_id: individualFields["p_first_name"].id,
          type: "SHORT_TEXT",
          content: expect.objectContaining({ value: "Mr. Oreo." }),
        },
      ]);

      const relationships = await mocks.knex
        .from("profile_relationship")
        .whereNull("deleted_at")
        .select("*");

      expect(relationships).toHaveLength(3);

      expect(
        relationships.map(
          pick([
            "created_by_integration_id",
            "left_side_profile_id",
            "right_side_profile_id",
            "profile_relationship_type_id",
          ]),
        ),
      ).toIncludeSameMembers([
        {
          created_by_integration_id: orgIntegration.id,
          left_side_profile_id: mcDonaldsPJProfileId,
          right_side_profile_id: mcDonaldsPFProfileId,
          profile_relationship_type_id:
            relationshipTypes["p_legal_representative__legally_represented"].id,
        },
        {
          created_by_integration_id: orgIntegration.id,
          left_side_profile_id: pepsiPJProfileId,
          right_side_profile_id: pepsiPFProfileId,
          profile_relationship_type_id:
            relationshipTypes["p_legal_representative__legally_represented"].id,
        },
        {
          created_by_integration_id: orgIntegration.id,
          left_side_profile_id: cocaColaPJProfileId,
          right_side_profile_id: cocaColaPFProfileId,
          profile_relationship_type_id:
            relationshipTypes["p_legal_representative__legally_represented"].id,
        },
      ]);
    });

    // This is a long-running test that will mock the SAP client to return 10000 results, and then sync the profiles to the database.
    // The final goal is to test the performance impact of the service when syncing a large amount of profiles.
    // For normal testing this will be skipped as the total time of the entire test suite will be too long.
    it.skip("with massive amount of results in remote", async () => {
      client.setNextExpectedCalls([
        [
          "getMetadata",
          ["sap/API_BUSINESS_PARTNER"],
          readFileSync(
            join(__dirname, `./odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`),
            "utf-8",
          ),
        ],
      ]);

      const orgIntegration = await createSapIntegration([
        {
          name: "BusinessPartner to Legal Entity",
          entityDefinition: {
            servicePath: "sap/API_BUSINESS_PARTNER",
            serviceNamespace: "API_BUSINESS_PARTNER",
            entitySetName: "A_BusinessPartner",
            remoteEntityKey: ["BusinessPartner"],
          },
          profileTypeId: legalEntity.id,
          remoteEntityKeyBinding: {
            profileTypeFieldIds: [legalEntityFields["p_tax_id"].id],
          },
          initialSyncOrderBy: [
            ["CreationDate", "asc"],
            ["CreationTime", "asc"],
            ["BusinessPartnerUUID", "asc"],
          ],
          changeDetection: {
            type: "POLLING",
            remoteLastChange: {
              type: "DATETIME_TIME",
              fields: ["LastChangeDate", "LastChangeTime"],
            },
          },
          fieldMappings: [
            {
              remoteEntityFields: ["OrganizationBPName1"],
              profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
              direction: "TO_LOCAL",
            },
            {
              remoteEntityFields: ["YY1_AMT_CLIENT_STATUS_bus"],
              profileTypeFieldIds: [legalEntityFields["p_client_status"].id],
              direction: "BOTH",
              toLocalTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "01", to: "ACTIVE" }, // Active (01)
                    { from: "03", to: "CANCELLED" }, // Locked (03)
                    { from: "04", to: "REJECTED" }, // Rejected (04)
                    { from: "08", to: "CLOSED" }, // Closed (08)
                  ],
                },
              ],
              toRemoteTransforms: [
                {
                  type: "MAP",
                  map: [
                    { from: "ACTIVE", to: "01" }, // Active (01)
                    { from: "CANCELLED", to: "03" }, // Locked (03)
                    { from: "REJECTED", to: "04" }, // Rejected (04)
                    { from: "CLOSED", to: "08" }, // Closed (08)
                  ],
                },
              ],
            },
          ],
          relationshipMappings: [
            {
              name: "to_BusinessPartnerAddress",
              syncStrategy: {
                type: "EMBED_INTO_PARENT",
                fieldMappings: [
                  {
                    remoteEntityFields: ["StreetName"],
                    profileTypeFieldIds: [legalEntityFields["p_registered_address"].id],
                    direction: "BOTH",
                  },
                  {
                    remoteEntityFields: ["CityName"],
                    profileTypeFieldIds: [legalEntityFields["p_city"].id],
                    direction: "BOTH",
                  },
                  {
                    remoteEntityFields: ["PostalCode"],
                    profileTypeFieldIds: [legalEntityFields["p_zip"].id],
                    direction: "BOTH",
                  },
                  {
                    remoteEntityFields: ["Country"],
                    profileTypeFieldIds: [legalEntityFields["p_country"].id],
                    direction: "BOTH",
                  },
                ],
              },
              fetchStrategy: {
                type: "FROM_NAVIGATION_PROPERTY",
                expectedCardinality: "MANY",
                navigationProperty: "to_BusinessPartnerAddress",
                entityDefinition: {
                  servicePath: "sap/API_BUSINESS_PARTNER",
                  serviceNamespace: "API_BUSINESS_PARTNER",
                  entitySetName: "A_BusinessPartnerAddress",
                  remoteEntityKey: ["BusinessPartner", "AddressID"],
                },
              },
            },
          ],
        },
      ]);

      client.assertNoMoreCalls();

      const sap = getIntegration(orgIntegration.id);

      client.setNextExpectedCalls([
        [
          "getEntitySet",
          [
            {
              servicePath: "sap/API_BUSINESS_PARTNER",
              serviceNamespace: "API_BUSINESS_PARTNER",
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
            },
            {
              $orderby: [
                ["CreationDate", "asc"],
                ["CreationTime", "asc"],
                ["BusinessPartnerUUID", "asc"],
              ],
              $select: [
                "BusinessPartner",
                "OrganizationBPName1",
                "YY1_AMT_CLIENT_STATUS_bus",
                "to_BusinessPartnerAddress/BusinessPartner",
                "to_BusinessPartnerAddress/AddressID",
                "to_BusinessPartnerAddress/StreetName",
                "to_BusinessPartnerAddress/CityName",
                "to_BusinessPartnerAddress/PostalCode",
                "to_BusinessPartnerAddress/Country",
              ],
              $expand: ["to_BusinessPartnerAddress"],
            },
          ],
          {
            results: range(0, 10000).map((i) => ({
              BusinessPartner: `BP_${i}`,
              OrganizationBPName1: `BPName_${i}`,
              YY1_AMT_CLIENT_STATUS_bus: "01",
              to_BusinessPartnerAddress: {
                results: [
                  {
                    BusinessPartner: `BP_${i}`,
                    AddressID: `ADDR_${i}`,
                    StreetName: `StreetName_${i}`,
                    CityName: `CityName_${i}`,
                    PostalCode: `PostalCode_${i}`,
                    Country: "US",
                  },
                ],
              },
            })),
          },
        ],
      ]);

      await sap.initialSync();

      client.assertNoMoreCalls();

      const profiles = await mocks.knex
        .from("profile")
        .where({ org_id: organization.id, profile_type_id: legalEntity.id, deleted_at: null })
        .orderBy("created_at", "asc")
        .select("*");

      expect(profiles).toHaveLength(10000);
    }, 60000);
  });

  describe("pollForChangedEntities", () => {
    describe("with a single mapping and no relationships changeDetection: POLLING/DATETIME_TIME", () => {
      let orgIntegration: OrgIntegration;
      let profiles: Profile[];
      beforeAll(async () => {
        client.setNextExpectedCalls([
          [
            "getMetadata",
            ["sap/API_BUSINESS_PARTNER"],
            readFileSync(
              join(__dirname, `./odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`),
              "utf-8",
            ),
          ],
        ]);
        orgIntegration = await createSapIntegration([
          {
            name: "BusinessPartner to Legal Entity",
            entityDefinition: {
              servicePath: "sap/API_BUSINESS_PARTNER",
              serviceNamespace: "API_BUSINESS_PARTNER",
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
            },
            profileTypeId: legalEntity.id,
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [legalEntityFields["p_tax_id"].id],
            },
            initialSyncOrderBy: [
              ["CreationDate", "asc"],
              ["CreationTime", "asc"],
              ["BusinessPartnerUUID", "asc"],
            ],
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME_TIME",
                fields: ["LastChangeDate", "LastChangeTime"],
              },
            },
            fieldMappings: [
              {
                remoteEntityFields: ["OrganizationBPName1"],
                profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
                direction: "TO_LOCAL",
              },
              {
                remoteEntityFields: ["YY1_AMT_CLIENT_STATUS_bus"],
                profileTypeFieldIds: [legalEntityFields["p_client_status"].id],
                direction: "BOTH",
                toLocalTransforms: [
                  {
                    type: "MAP",
                    map: [
                      { from: "01", to: "PENDING" },
                      { from: "02", to: "APPROVED" },
                      { from: "03", to: "REJECTED" },
                      { from: "04", to: "ACTIVE" },
                      { from: "05", to: "CLOSED" },
                    ],
                  },
                ],
                toRemoteTransforms: [
                  {
                    type: "MAP",
                    map: [
                      { from: "PENDING", to: "01" },
                      { from: "APPROVED", to: "02" },
                      { from: "REJECTED", to: "03" },
                      { from: "ACTIVE", to: "04" },
                      { from: "CLOSED", to: "05" },
                    ],
                  },
                ],
              },
              {
                remoteEntityFields: ["BusinessPartnerCategory"],
                profileTypeFieldIds: [legalEntityFields["assigned_user"].id],
                direction: "BOTH",
              },
            ],
          },
        ]);
        client.assertNoMoreCalls();

        await mocks.knex.from("profile_sync_log").insert({
          integration_id: orgIntegration.id,
          sync_type: "INITIAL",
          status: "COMPLETED",
          output: JSON.stringify({
            output: "DATABASE",
          }),
        });
      });

      beforeEach(async () => {
        await mocks.knex.from("profile").update({ deleted_at: new Date() });
        await mocks.knex.from("profile_field_value").update({ deleted_at: new Date() });
        await mocks.knex.from("profile_event").delete();

        profiles = await mocks.createRandomProfiles(organization.id, legalEntity.id, 5);
        for (const profile of profiles) {
          const index = profiles.indexOf(profile) + 1;
          await mocks.createProfileFieldValues(profile.id, [
            {
              profile_type_field_id: legalEntityFields["p_tax_id"].id,
              type: "SHORT_TEXT",
              content: { value: `Tax ID ${index + 1}` },
            },
            {
              profile_type_field_id: legalEntityFields["p_entity_name"].id,
              type: "SHORT_TEXT",
              content: { value: `Entity ${index + 1}` },
            },
          ]);
        }
      });

      it("updates the profiles with changes from remote", async () => {
        const sap = getIntegration(orgIntegration.id);

        client.setNextExpectedCalls([
          [
            "getEntitySet",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              {
                $orderby: [
                  ["LastChangeDate", "desc"],
                  ["LastChangeTime", "desc"],
                ],
                $select: [
                  "BusinessPartner",
                  "OrganizationBPName1",
                  "YY1_AMT_CLIENT_STATUS_bus",
                  "BusinessPartnerCategory",
                ],
                $filter: {
                  operator: "and",
                  conditions: [
                    {
                      operator: "or",
                      conditions: [
                        {
                          left: { type: "property", name: "LastChangeDate" },
                          operator: "gt",
                          right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
                        },
                        {
                          operator: "and",
                          conditions: [
                            {
                              left: { type: "property", name: "LastChangeDate" },
                              operator: "eq",
                              right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
                            },
                            {
                              left: { type: "property", name: "LastChangeTime" },
                              operator: "gt",
                              right: { type: "literal", value: "time'PT05H30M00S'" },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            ],
            {
              results: [
                {
                  BusinessPartner: "Tax ID 2",
                  OrganizationBPName1: "Entity 2",
                  YY1_AMT_CLIENT_STATUS_bus: "",
                  BusinessPartnerCategory: "mcdonalds@onparallel.com",
                },
                {
                  BusinessPartner: "Tax ID 3",
                  OrganizationBPName1: "Entity 3",
                  YY1_AMT_CLIENT_STATUS_bus: "01",
                  BusinessPartnerCategory: "pepsi@onparallel.com",
                },
                {
                  BusinessPartner: "Tax ID X",
                  OrganizationBPName1: "Entity X",
                  YY1_AMT_CLIENT_STATUS_bus: "03",
                  BusinessPartnerCategory: "cola@onparallel.com",
                },
              ],
            },
          ],
        ]);

        await sap.pollForChangedEntities(new Date("2025-01-01T05:30:00Z"));

        client.assertNoMoreCalls();

        const dbEvents = await mocks.knex.from("profile_event").select("*");

        expect(dbEvents).toHaveLength(
          5 + // 1 created + 3 values updated + 1 updated (new profile)
            5, // 4 updated + 1 value updated,
        );

        const dbValues = await mocks.knex
          .from("profile_field_value")
          .where("profile_type_field_id", legalEntityFields["p_tax_id"].id)
          .select("*");

        expect(dbEvents.map(pick(["type", "profile_id", "data"]))).toIncludeSameMembers([
          {
            type: "PROFILE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID 2")!.profile_id,
            data: {
              user_id: null,
              org_integration_id: orgIntegration.id,
              profile_type_field_ids: [legalEntityFields["assigned_user"].id],
            },
          },
          {
            type: "PROFILE_FIELD_VALUE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID 2")!.profile_id,
            data: expect.objectContaining({
              profile_type_field_id: legalEntityFields["assigned_user"].id,
            }),
          },
          {
            type: "PROFILE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID 3")!.profile_id,
            data: {
              user_id: null,
              org_integration_id: orgIntegration.id,
              profile_type_field_ids: [
                legalEntityFields["p_client_status"].id,
                legalEntityFields["assigned_user"].id,
              ],
            },
          },
          {
            type: "PROFILE_FIELD_VALUE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID 3")!.profile_id,
            data: expect.objectContaining({
              profile_type_field_id: legalEntityFields["assigned_user"].id,
            }),
          },
          {
            type: "PROFILE_FIELD_VALUE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID 3")!.profile_id,
            data: expect.objectContaining({
              profile_type_field_id: legalEntityFields["p_client_status"].id,
            }),
          },
          {
            type: "PROFILE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID X")!.profile_id,
            data: {
              user_id: null,
              org_integration_id: orgIntegration.id,
              profile_type_field_ids: expect.toIncludeSameMembers([
                legalEntityFields["p_tax_id"].id,
                legalEntityFields["p_entity_name"].id,
                legalEntityFields["p_client_status"].id,
              ]),
            },
          },
          {
            type: "PROFILE_FIELD_VALUE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID X")!.profile_id,
            data: expect.objectContaining({
              profile_type_field_id: legalEntityFields["p_tax_id"].id,
            }),
          },
          {
            type: "PROFILE_FIELD_VALUE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID X")!.profile_id,
            data: expect.objectContaining({
              profile_type_field_id: legalEntityFields["p_entity_name"].id,
            }),
          },
          {
            type: "PROFILE_FIELD_VALUE_UPDATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID X")!.profile_id,
            data: expect.objectContaining({
              profile_type_field_id: legalEntityFields["p_client_status"].id,
            }),
          },
          {
            type: "PROFILE_CREATED",
            profile_id: dbValues.find((v) => v.content.value === "Tax ID X")!.profile_id,
            data: {
              user_id: null,
              org_integration_id: orgIntegration.id,
            },
          },
        ]);
      });
    });
  });
});
