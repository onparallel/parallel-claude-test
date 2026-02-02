import { Container } from "inversify";
import { Knex } from "knex";
import { indexBy } from "remeda";
import {
  MockSapOdataClient,
  MockSapProfileSyncIntegrationSettingsValidator,
} from "../../../../../test/mocks";
import { createTestContainer } from "../../../../../test/testContainer";

import {
  Organization,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
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
import {
  ISapProfileSyncIntegrationSettingsValidator,
  PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR,
} from "../SapProfileSyncIntegrationSettingsValidator";
import { SapEntityMapping } from "../types";
import { expectProfilesAndRelationships } from "./utils";

describe("BasicSapProfileSyncIntegration", () => {
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

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);

    client = container.get<MockSapOdataClient>(SAP_ODATA_CLIENT);

    await container.unbind(PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR);
    container
      .bind<ISapProfileSyncIntegrationSettingsValidator>(
        PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR,
      )
      .to(MockSapProfileSyncIntegrationSettingsValidator);

    const profilesSetup = container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);

    await profilesSetup.createDefaultProfileTypes(organization.id, "TEST");

    [legalEntity] = await knex
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

    const _legalEntityFields = await knex
      .from("profile_type_field")
      .where("profile_type_id", legalEntity.id)
      .whereNull("deleted_at")
      .select("*");

    legalEntityFields = indexBy(_legalEntityFields, (f) => f.alias!);

    await knex
      .from("profile_type_field")
      .where({
        profile_type_id: legalEntity.id,
        deleted_at: null,
        alias: "p_tax_id",
      })
      .update({
        is_unique: true,
      });

    [individual] = await knex
      .from("profile_type")
      .where({
        standard_type: "INDIVIDUAL",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");

    const _individualFields = await knex
      .from("profile_type_field")
      .where("profile_type_id", individual.id)
      .whereNull("deleted_at")
      .select("*");

    individualFields = indexBy(_individualFields, (f) => f.alias!);

    await knex
      .from("profile_type_field")
      .where({
        profile_type_id: individual.id,
        deleted_at: null,
        alias: "p_tax_id",
      })
      .update({
        is_unique: true,
      });

    const _relationshipTypes = await knex
      .from("profile_relationship_type")
      .where({ org_id: organization.id, deleted_at: null })
      .select("*");
    relationshipTypes = indexBy(_relationshipTypes, (r) => r.alias!);
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
    await knex.from("org_integration").update({ deleted_at: null });

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
      await knex.from("profile").update({ deleted_at: new Date() });
      await knex.from("profile_relationship").update({ deleted_at: new Date() });
      await knex.from("profile_field_value").update({ deleted_at: new Date() });
    });

    it("with simple mapping and no relationships", async () => {
      const orgIntegration = await createSapIntegration([
        {
          name: "Companies",
          entityDefinition: {
            servicePath: "Companies",
            serviceNamespace: "Companies",
            entitySetName: "Companies",
            remoteEntityKey: ["TaxId"],
          },
          profileTypeId: legalEntity.id,
          remoteEntityKeyBinding: {
            profileTypeFieldIds: [legalEntityFields["p_tax_id"].id],
          },
          initialSyncOrderBy: [["CreationDate", "asc"]],
          changeDetection: {
            type: "POLLING",
            remoteLastChange: {
              type: "DATETIME",
              field: "LastChangeDate",
            },
          },
          fieldMappings: [
            {
              remoteEntityFields: ["Name"],
              profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
              direction: "TO_LOCAL",
            },
          ],
          relationshipMappings: [
            {
              name: "to_Owner",
              syncStrategy: {
                type: "REPLICATE_RELATIONSHIP",
                entityMappingIndex: 1,
                missingRemoteRelationshipStrategy: "IGNORE",
                parentProfileRelationshipSide: "RIGHT",
                profileRelationshipTypeId: relationshipTypes["p_director__managed_by"].id,
              },
              fetchStrategy: {
                type: "FROM_NAVIGATION_PROPERTY",
                expectedCardinality: "ONE",
                navigationProperty: "to_Owner",
                entityDefinition: {
                  servicePath: "People",
                  serviceNamespace: "People",
                  entitySetName: "People",
                  remoteEntityKey: ["Id"],
                },
              },
            },
            {
              name: "Address",
              fetchStrategy: {
                type: "FROM_NAVIGATION_PROPERTY",
                expectedCardinality: "MANY",
                navigationProperty: "to_Addresses",
                entityDefinition: {
                  servicePath: "Addresses",
                  serviceNamespace: "Addresses",
                  entitySetName: "Addresses",
                  remoteEntityKey: ["Id"],
                },
              },
              syncStrategy: {
                type: "EMBED_INTO_PARENT",
                fieldMappings: [
                  {
                    remoteEntityFields: ["StreetName"],
                    profileTypeFieldIds: [legalEntityFields["p_registered_address"].id],
                    direction: "BOTH",
                  },
                ],
              },
            },
          ],
        },
        {
          name: "People",
          entityDefinition: {
            servicePath: "People",
            serviceNamespace: "People",
            entitySetName: "People",
            remoteEntityKey: ["Id"],
          },
          remoteEntityKeyBinding: {
            profileTypeFieldIds: [individualFields["p_tax_id"].id],
          },
          profileTypeId: individual.id,
          initialSyncOrderBy: [["CreationDate", "asc"]],
          changeDetection: {
            type: "POLLING",
            remoteLastChange: { type: "DATETIME", field: "CreationDate" },
          },
          fieldMappings: [
            {
              remoteEntityFields: ["FirstName"],
              profileTypeFieldIds: [individualFields["p_first_name"].id],
              direction: "TO_LOCAL",
            },
            {
              remoteEntityFields: ["LastName"],
              profileTypeFieldIds: [individualFields["p_last_name"].id],
              direction: "TO_LOCAL",
            },
          ],
          relationshipMappings: [
            {
              name: "to_Companies",
              syncStrategy: {
                type: "REPLICATE_RELATIONSHIP",
                entityMappingIndex: 0,
                missingRemoteRelationshipStrategy: "IGNORE",
                parentProfileRelationshipSide: "LEFT",
                profileRelationshipTypeId: relationshipTypes["p_director__managed_by"].id,
              },
              fetchStrategy: {
                type: "FROM_NAVIGATION_PROPERTY",
                expectedCardinality: "ONE",
                navigationProperty: "to_Companies",
                entityDefinition: {
                  servicePath: "Companies",
                  serviceNamespace: "Companies",
                  entitySetName: "Companies",
                  remoteEntityKey: ["TaxId"],
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
              servicePath: "Companies",
              serviceNamespace: "Companies",
              entitySetName: "Companies",
              remoteEntityKey: ["TaxId"],
            },
            {
              $orderby: [["CreationDate", "asc"]],
              $expand: ["to_Owner", "to_Addresses"],
              $select: [
                "TaxId",
                "Name",
                "to_Owner/FirstName",
                "to_Owner/Id",
                "to_Owner/LastName",
                "to_Addresses/Id",
                "to_Addresses/StreetName",
              ],
            },
          ],
          {
            results: [
              {
                TaxId: "1",
                Name: "McDonalds",
                to_Owner: {
                  FirstName: "John",
                  Id: "1",
                  LastName: "Doe",
                },
                to_Addresses: {
                  results: [
                    {
                      Id: "1",
                      StreetName: "123 Main St",
                    },
                  ],
                },
              },
              {
                TaxId: "2",
                Name: "Pepsi",
                to_Owner: {
                  FirstName: "Jane",
                  Id: "2",
                  LastName: "Doe",
                },
                to_Addresses: {
                  results: [
                    {
                      Id: "2",
                      StreetName: "456 Main St",
                    },
                  ],
                },
              },
            ],
          },
        ],
        [
          "getEntitySet",
          [
            {
              servicePath: "People",
              serviceNamespace: "People",
              entitySetName: "People",
              remoteEntityKey: ["Id"],
            },
            {
              $orderby: [["CreationDate", "asc"]],
              $expand: ["to_Companies", "to_Companies/to_Addresses"],
              $select: [
                "Id",
                "FirstName",
                "LastName",
                "to_Companies/TaxId",
                "to_Companies/Name",
                "to_Companies/to_Addresses/Id",
                "to_Companies/to_Addresses/StreetName",
              ],
            },
          ],
          {
            results: [
              {
                Id: "1",
                FirstName: "John",
                LastName: "Doe",
                to_Companies: {
                  TaxId: "1",
                  Name: "McDonalds",
                  to_Addresses: {
                    results: [
                      {
                        Id: "1",
                        StreetName: "123 Main St",
                      },
                    ],
                  },
                },
              },
              {
                Id: "2",
                FirstName: "Jane",
                LastName: "Doe",
                to_Companies: {
                  TaxId: "2",
                  Name: "Pepsi",
                  to_Addresses: {
                    results: [
                      {
                        Id: "2",
                        StreetName: "456 Main St",
                      },
                    ],
                  },
                },
              },
            ],
          },
        ],
      ]);

      await sap.initialSync();
      client.assertNoMoreCalls();

      await expectProfilesAndRelationships(
        knex,
        organization.id,
        [
          {
            profile_type_id: legalEntity.id,
            values: {
              p_tax_id: "1",
              p_entity_name: "McDonalds",
              p_registered_address: "123 Main St",
            },
          },
          {
            profile_type_id: individual.id,
            values: { p_tax_id: "1", p_first_name: "John", p_last_name: "Doe" },
          },
          {
            profile_type_id: legalEntity.id,
            values: { p_tax_id: "2", p_entity_name: "Pepsi", p_registered_address: "456 Main St" },
          },
          {
            profile_type_id: individual.id,
            values: { p_tax_id: "2", p_first_name: "Jane", p_last_name: "Doe" },
          },
        ],
        [
          [
            "p_director__managed_by",
            [individual.id, "p_tax_id", "1"],
            [legalEntity.id, "p_tax_id", "1"],
          ],
          [
            "p_director__managed_by",
            [individual.id, "p_tax_id", "2"],
            [legalEntity.id, "p_tax_id", "2"],
          ],
        ],
      );

      const syncLog = await mocks.knex
        .from("profile_sync_log")
        .where("integration_id", orgIntegration.id)
        .select("*");

      expect(syncLog).toMatchObject([{ sync_type: "INITIAL", status: "COMPLETED", error: null }]);
    });
  });
});
