import { faker } from "@faker-js/faker";
import { readFileSync } from "fs";
import { Container } from "inversify";
import { Knex } from "knex";
import { join } from "path";
import { indexBy } from "remeda";
import { MockSapOdataClient } from "../../../../../test/mocks";
import { createTestContainer } from "../../../../../test/testContainer";
import { ILogger, LOGGER } from "../../../../services/Logger";
import {
  Organization,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
} from "../../../../db/__types";
import { KNEX } from "../../../../db/knex";
import { Mocks } from "../../../../db/repositories/__tests__/mocks";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
} from "../../../../services/ProfilesSetupService";
import { deleteAllData } from "../../../../util/knexUtils";
import { SAP_ODATA_CLIENT } from "../SapOdataClient";
import {
  ISapProfileSyncIntegrationSettingsValidator,
  PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR,
} from "../SapProfileSyncIntegrationSettingsValidator";

describe("SapProfileSyncIntegrationSettingsValidator", () => {
  let container: Container;
  let validator: ISapProfileSyncIntegrationSettingsValidator;
  let knex: Knex;
  let mocks: Mocks;

  let client: MockSapOdataClient;

  let organization: Organization;

  let individual: ProfileType;
  let legalEntity: ProfileType;
  let contract: ProfileType;

  let individualFields: Record<string, ProfileTypeField>;
  let legalEntityFields: Record<string, ProfileTypeField>;
  let contractFields: Record<string, ProfileTypeField>;

  let relationshipTypes: Record<string, ProfileRelationshipType>;

  beforeAll(async () => {
    container = await createTestContainer();

    const noopLogger: ILogger = { log() {}, info() {}, warn() {}, error() {}, debug() {} };
    await container.unbind(LOGGER);
    container.bind<ILogger>(LOGGER).toConstantValue(noopLogger);

    client = container.get<MockSapOdataClient>(SAP_ODATA_CLIENT);

    knex = container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1);

    const profilesSetup = container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);
    await profilesSetup.createDefaultProfileTypes(organization.id, "TEST");
    await profilesSetup.createContractProfileType(
      { org_id: organization.id, name: { en: "Contract" }, name_plural: { en: "Contracts" } },
      "TEST",
    );

    [individual] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "INDIVIDUAL",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");
    [legalEntity] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "LEGAL_ENTITY",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");
    [contract] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "CONTRACT",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");

    const _individualFields = await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: individual.id,
        deleted_at: null,
      })
      .select("*");
    individualFields = indexBy(_individualFields, (f) => f.alias!);

    const _legalEntityFields = await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: legalEntity.id,
        deleted_at: null,
      })
      .select("*");
    legalEntityFields = indexBy(_legalEntityFields, (f) => f.alias!);

    const _contractFields = await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: contract.id,
        deleted_at: null,
      })
      .select("*");
    contractFields = indexBy(_contractFields, (f) => f.alias!);

    const _relationshipTypes = await mocks.knex
      .from("profile_relationship_type")
      .where({ org_id: organization.id, deleted_at: null })
      .select("*");
    relationshipTypes = indexBy(_relationshipTypes, (r) => r.alias!);
  });

  beforeEach(async () => {
    // reset validator cache
    validator = container.get<ISapProfileSyncIntegrationSettingsValidator>(
      PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR,
    );

    await mocks.knex
      .from("profile_type_field")
      .whereIn("profile_type_id", [individual.id, legalEntity.id])
      .where({
        deleted_at: null,
        alias: "p_tax_id",
      })
      .update({
        is_unique: true,
      });
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  afterEach(async () => {
    client.setNextExpectedCalls([]);
  });

  it.each([
    ["https://www.google.com/", "must not end with a slash"],
    ["http://www.google.com", "must start with https://"],
  ])("fails to validate baseUrl %s", async (baseUrl, expectedErrorMessage) => {
    await expect(
      validator.validate(organization.id, {
        authorization: { type: "BASIC", user: "XXX", password: "XXX" },
        mappings: [],
        baseUrl,
      }),
    ).rejects.toMatchObject({ path: "baseUrl", message: expectedErrorMessage });
  });

  it.each([
    ["https://my303668-api.s4hana.ondemand.com/sap/opu/odata"],
    [new URL(faker.internet.url({ protocol: "https" })).toString().slice(0, -1)],
  ])(
    "validates baseUrl %s",
    async (baseUrl) =>
      await expect(
        validator.validate(organization.id, {
          authorization: { type: "BASIC", user: "XXX", password: "XXX" },
          mappings: [],
          baseUrl,
        }),
      ).resolves.not.toThrow(),
  );

  it("validates profileTypeId exists on the organization", async () => {
    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
          {
            name: "BusinessPartner to Legal Entity",
            entityDefinition: {
              servicePath: "sap/API_BUSINESS_PARTNER",
              serviceNamespace: "API_BUSINESS_PARTNER",
              entitySetName: "A_BusinessPartner",
              remoteEntityKey: ["BusinessPartner"],
            },
            profileTypeId: -1,
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
            ],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({ path: "mappings[0].profileTypeId", message: "invalid id" });
  });

  it("validates filter with no conditions", async () => {
    client.setNextExpectedCalls([
      [
        "getMetadata",
        ["CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV"],
        readFileSync(
          join(__dirname, `./odata/responses/CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV/$metadata.xml`),
          "utf-8",
        ),
      ],
    ]);

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
          {
            name: "Contracts",
            profileTypeId: contract.id,
            entityDefinition: {
              servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
              serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
              entitySetName: "ProjectSet",
              remoteEntityKey: ["ProjectID"],
            },
            fieldMappings: [
              {
                direction: "BOTH",
                remoteEntityFields: ["YY1_ServiceType_Cpr"],
                profileTypeFieldIds: [contractFields["p_contract_type"].id],
              },
            ],
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [contractFields["p_counterparty"].id],
            },
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "CreatedOn",
              },
            },
            initialSyncOrderBy: [["CreatedOn", "asc"]],
            filter: {
              conditions: [],
              operator: "and",
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].filter.conditions",
      message: "Filter group must have at least one condition",
    });

    client.assertNoMoreCalls();
  });

  it("validates filter where a field does not exist", async () => {
    client.setNextExpectedCalls([
      [
        "getMetadata",
        ["CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV"],
        readFileSync(
          join(__dirname, `./odata/responses/CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV/$metadata.xml`),
          "utf-8",
        ),
      ],
    ]);

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
          {
            name: "Contracts",
            profileTypeId: contract.id,
            entityDefinition: {
              servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
              serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
              entitySetName: "ProjectSet",
              remoteEntityKey: ["ProjectID"],
            },
            fieldMappings: [
              {
                direction: "BOTH",
                remoteEntityFields: ["YY1_ServiceType_Cpr"],
                profileTypeFieldIds: [contractFields["p_contract_type"].id],
              },
            ],
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [contractFields["p_counterparty"].id],
            },
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "CreatedOn",
              },
            },
            initialSyncOrderBy: [["CreatedOn", "asc"]],
            filter: {
              conditions: [
                {
                  operator: "not",
                  expr: {
                    function: "startswith",
                    args: [{ type: "property", name: "ProjectID" }],
                  },
                },
                {
                  operator: "and",
                  conditions: [
                    {
                      operator: "not",
                      expr: {
                        function: "length",
                        args: [{ type: "property", name: "XXX" }],
                      },
                    },
                  ],
                },
              ],
              operator: "and",
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].filter.conditions[1].conditions[0].expr.args[0].name",
      message: "Field XXX does not exist in entity type Project",
    });

    client.assertNoMoreCalls();
  });

  it("validates field names on initialSyncOrderBy", async () => {
    client.setNextExpectedCalls([
      [
        "getMetadata",
        ["CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV"],
        readFileSync(
          join(__dirname, `./odata/responses/CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV/$metadata.xml`),
          "utf-8",
        ),
      ],
    ]);

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
          {
            name: "Contracts",
            profileTypeId: contract.id,
            entityDefinition: {
              servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
              serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
              entitySetName: "ProjectSet",
              remoteEntityKey: ["ProjectID"],
            },
            fieldMappings: [
              {
                direction: "BOTH",
                remoteEntityFields: ["YY1_ServiceType_Cpr"],
                profileTypeFieldIds: [contractFields["p_contract_type"].id],
              },
            ],
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [contractFields["p_counterparty"].id],
            },
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "CreatedOn",
              },
            },
            initialSyncOrderBy: [
              ["CreatedOn", "asc"],
              ["XXX", "asc"],
            ],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].initialSyncOrderBy[1][0]",
      message: 'Field "XXX" does not exist in entity type Project',
    });

    client.assertNoMoreCalls();
  });

  it("validates field names on changeDetection POLLING type DATETIME", async () => {
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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                type: "DATETIME",
                field: "CreationTime",
              },
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].changeDetection.remoteLastChange.field",
      message:
        'Invalid DateTime field "CreationTime" used in DATETIME SapPollingLastChangeStrategy',
    });

    client.assertNoMoreCalls();
  });

  it("validates first field name on changeDetection POLLING type DATETIME_TIME", async () => {
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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                fields: ["Supplier", "CreationTime"],
              },
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].changeDetection.remoteLastChange.fields[0]",
      message:
        'Invalid DateTime field "Supplier" used as first field of a DATETIME_TIME SapPollingLastChangeStrategy',
    });

    client.assertNoMoreCalls();
  });

  it("validates second field name on changeDetection POLLING type DATETIME_TIME", async () => {
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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                fields: ["CreationDate", "Supplier"],
              },
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].changeDetection.remoteLastChange.fields[1]",
      message:
        'Invalid Time field "Supplier" used as second field of a DATETIME_TIME SapPollingLastChangeStrategy',
    });

    client.assertNoMoreCalls();
  });

  it("validates field names on changeDetection POLLING type DATETIME_OFFSET", async () => {
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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                type: "DATETIME_OFFSET",
                field: "ValidityStartDate",
              },
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].changeDetection.remoteLastChange.field",
      message:
        'Invalid DateTime field "ValidityStartDate" used in DATETIME_OFFSET SapPollingLastChangeStrategy',
    });

    client.assertNoMoreCalls();
  });

  it("validates field is unique on fieldMappings if passing only one", async () => {
    await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: legalEntity.id,
        deleted_at: null,
        alias: "p_tax_id",
      })
      .update({ is_unique: false });

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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                type: "DATETIME",
                field: "CreationDate",
              },
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].remoteEntityKeyBinding.profileTypeFieldIds[0]",
      message: `Field with id "${legalEntityFields["p_tax_id"].id}" is not unique`,
    });

    client.assertNoMoreCalls();
  });

  it("validates remoteEntityFields are valid on fieldMappings", async () => {
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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
            fieldMappings: [
              {
                remoteEntityFields: ["OrganizationBPName1"],
                profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
                direction: "TO_LOCAL",
              },
              {
                remoteEntityFields: ["BusinessPartnerBirthplaceName", "XXX"],
                profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
                direction: "TO_REMOTE",
              },
            ],
            initialSyncOrderBy: [
              ["CreationDate", "asc"],
              ["CreationTime", "asc"],
              ["BusinessPartnerUUID", "asc"],
            ],
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "CreationDate",
              },
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].fieldMappings[1].remoteEntityFields[1]",
      message: 'Field "XXX" does not exist in entity type A_BusinessPartnerType',
    });

    client.assertNoMoreCalls();
  });

  it("validates remoteEntityField is updatable when mapping to remote on fieldMappings", async () => {
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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
            fieldMappings: [
              {
                remoteEntityFields: ["OrganizationBPName1"],
                profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
                direction: "TO_LOCAL",
              },
              {
                remoteEntityFields: ["BusinessPartnerBirthplaceName", "Customer"],
                profileTypeFieldIds: [legalEntityFields["p_entity_name"].id],
                direction: "TO_REMOTE",
              },
            ],
            initialSyncOrderBy: [
              ["CreationDate", "asc"],
              ["CreationTime", "asc"],
              ["BusinessPartnerUUID", "asc"],
            ],
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "CreationDate",
              },
            },
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].fieldMappings[1].remoteEntityFields[1]",
      message: 'Field "Customer" is not updatable in entity type A_BusinessPartnerType',
    });

    client.assertNoMoreCalls();
  });

  it("validates that field transforms are defined", async () => {
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

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                      { from: "03", to: "XXX" }, // Locked (03)
                      { from: "04", to: "REJECTED" }, // Rejected (04)
                      { from: "08", to: "CLOSED" }, // Closed (08)
                    ],
                  },
                  {
                    type: "HELLO_WORLD",
                    prop: 1,
                  },
                ],
              },
            ],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].fieldMappings[1].toLocalTransforms[1].type",
      message: 'Transform "HELLO_WORLD" is not defined',
    });

    client.assertNoMoreCalls();
  });

  it("validates orderBy in fetchStrategy FROM_NAVIGATION_PROPERTY", async () => {
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
    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                  ],
                },
                fetchStrategy: {
                  orderBy: [["XXX", "asc"]],
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
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].relationshipMappings[0].fetchStrategy.orderBy[0][0]",
      message: 'Field "XXX" does not exist in entity type A_BusinessPartnerAddressType',
    });

    client.assertNoMoreCalls();
  });

  it("validates orderBy in fetchStrategy FROM_ENTITY_SET", async () => {
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
    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                  ],
                },
                fetchStrategy: {
                  type: "FROM_ENTITY_SET",
                  orderBy: [["XXX", "asc"]],
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
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].relationshipMappings[0].fetchStrategy.orderBy[0][0]",
      message: 'Field "XXX" does not exist in entity type A_BusinessPartnerAddressType',
    });

    client.assertNoMoreCalls();
  });

  it("validates fetchStrategy FROM_ENTITY with incomplete entityKey", async () => {
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
    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                  ],
                },
                fetchStrategy: {
                  type: "FROM_ENTITY",
                  entityDefinition: {
                    servicePath: "sap/API_BUSINESS_PARTNER",
                    serviceNamespace: "API_BUSINESS_PARTNER",
                    entitySetName: "A_BusinessPartnerAddress",
                    remoteEntityKey: ["BusinessPartner", "AddressID"],
                  },
                  key: {
                    BusinessPartner: { entityFields: ["BusinessPartner"] },
                  },
                },
              },
            ],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].relationshipMappings[0].fetchStrategy.key",
      message:
        "Keys must match the remote entity key (Expected: AddressID, BusinessPartner. Actual: BusinessPartner)",
    });

    client.assertNoMoreCalls();
  });

  it("validates fetchStrategy FROM_ENTITY with unknown parentEntityField", async () => {
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
    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                  ],
                },
                fetchStrategy: {
                  type: "FROM_ENTITY",
                  entityDefinition: {
                    servicePath: "sap/API_BUSINESS_PARTNER",
                    serviceNamespace: "API_BUSINESS_PARTNER",
                    entitySetName: "A_BusinessPartnerAddress",
                    remoteEntityKey: ["BusinessPartner", "AddressID"],
                  },
                  key: {
                    BusinessPartner: { entityFields: ["BusinessPartner"] },
                    AddressID: { entityFields: ["XXX"] },
                  },
                },
              },
            ],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].relationshipMappings[0].fetchStrategy.key.AddressID.entityFields[0]",
      message: 'Field "XXX" does not exist in entity type A_BusinessPartnerType',
    });

    client.assertNoMoreCalls();
  });

  it("validates settings with nested REPLICATE_RELATIONSHIP", async () => {
    client.setNextExpectedCalls(
      (
        [
          ["getMetadata", "sap/API_BUSINESS_PARTNER"],
          ["getMetadata", "sap/YY1_ANTIMONEYLAUNDERING_CDS"],
          ["getMetadata", "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV"],
        ] as const
      ).map(([method, servicePath]) => [
        method,
        [servicePath],
        readFileSync(join(__dirname, `./odata/responses/${servicePath}/$metadata.xml`), "utf-8"),
      ]),
    );

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
            filter: {
              operator: "and",
              conditions: [
                {
                  left: { type: "property", name: "IsNaturalPerson" },
                  operator: "eq",
                  right: { type: "literal", value: "''" },
                },
                {
                  left: { type: "property", name: "Customer" },
                  operator: "ne",
                  right: { type: "literal", value: "null" },
                },
                // limit business partners for testing
                {
                  left: { type: "property", name: "BusinessPartner" },
                  operator: "le",
                  right: { type: "literal", value: "'10'" },
                  // operator: "eq",
                  // right: { type: "literal", value: "'27'" },
                },
                {
                  left: { type: "property", name: "BusinessPartner" },
                  operator: "ne",
                  right: { type: "literal", value: "'3'" }, // este cliente tiene casi 1000 expedientes
                },
              ],
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
                  relationshipMappings: [
                    {
                      name: "to_PhoneNumber",
                      syncStrategy: {
                        type: "EMBED_INTO_PARENT",
                        fieldMappings: [
                          {
                            remoteEntityFields: ["InternationalPhoneNumber"],
                            profileTypeFieldIds: [legalEntityFields["p_phone_number"].id],
                            direction: "TO_LOCAL",
                          },
                          {
                            remoteEntityFields: ["PhoneNumber", "DestinationLocationCountry"],
                            profileTypeFieldIds: [legalEntityFields["p_phone_number"].id],
                            direction: "TO_REMOTE",
                            toRemoteTransforms: [{ type: "PARSE_INT_PHONE_NUMBER" }],
                          },
                        ],
                      },
                      fetchStrategy: {
                        type: "FROM_NAVIGATION_PROPERTY",
                        expectedCardinality: "MANY",
                        navigationProperty: "to_PhoneNumber",
                        entityDefinition: {
                          servicePath: "sap/API_BUSINESS_PARTNER",
                          serviceNamespace: "API_BUSINESS_PARTNER",
                          entitySetName: "A_AddressPhoneNumber",
                          remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                        },
                        filter: {
                          left: { type: "property", name: "IsDefaultPhoneNumber" },
                          operator: "eq",
                          right: { type: "literal", value: "true" },
                        },
                      },
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
                  filter: {
                    left: { type: "property", name: "Country" },
                    operator: "eq",
                    right: { type: "literal", value: "'{{country}}'" },
                  },
                  filterParams: {
                    country: {
                      entityFields: ["BusinessPartner"],
                      transforms: [{ type: "PAD_LEFT", length: 10, character: "0" }],
                    },
                  },
                },
              },
              {
                name: "to_BusinessPartnerTax",
                syncStrategy: {
                  type: "EMBED_INTO_PARENT",
                  fieldMappings: [
                    {
                      remoteEntityFields: ["BPTaxNumber"],
                      profileTypeFieldIds: [legalEntityFields["p_tax_id"].id],
                      direction: "TO_LOCAL",
                    },
                  ],
                },
                fetchStrategy: {
                  type: "FROM_NAVIGATION_PROPERTY",
                  expectedCardinality: "MANY",
                  navigationProperty: "to_BusinessPartnerTax",
                  entityDefinition: {
                    servicePath: "sap/API_BUSINESS_PARTNER",
                    serviceNamespace: "API_BUSINESS_PARTNER",
                    entitySetName: "A_BusinessPartnerTaxNumber",
                    remoteEntityKey: ["BusinessPartner", "BPTaxType"],
                  },
                },
              },
              {
                name: "to_Customer",
                syncStrategy: {
                  type: "EMBED_INTO_PARENT",
                  fieldMappings: [
                    {
                      remoteEntityFields: ["YY1_ClientPartnerNum_cus"],
                      profileTypeFieldIds: [legalEntityFields["p_registration_number"].id],
                      direction: "TO_LOCAL",
                    },
                  ],
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
              {
                name: "YY1_ANTIMONEYLAUNDERING",
                syncStrategy: {
                  type: "EMBED_INTO_PARENT",
                  fieldMappings: [
                    {
                      direction: "BOTH",
                      remoteEntityFields: ["RiskLevel"],
                      profileTypeFieldIds: [legalEntityFields["p_risk"].id],
                    },
                  ],
                },
                fetchStrategy: {
                  type: "FROM_ENTITY_SET",
                  entityDefinition: {
                    servicePath: "sap/YY1_ANTIMONEYLAUNDERING_CDS",
                    serviceNamespace: "YY1_ANTIMONEYLAUNDERING_CDS",
                    entitySetName: "YY1_ANTIMONEYLAUNDERING",
                    remoteEntityKey: [{ name: "SAP_UUID", type: "guid" }],
                  },
                  filter: {
                    operator: "or",
                    conditions: [
                      {
                        left: { type: "property", name: "BusinessPartner" },
                        operator: "eq",
                        right: { type: "literal", value: "'{{businessPartnerId}}'" },
                      },
                      {
                        left: { type: "property", name: "BusinessPartner" },
                        operator: "eq",
                        right: { type: "literal", value: "'{{paddedBusinessPartnerId}}'" },
                      },
                    ],
                  },
                  filterParams: {
                    businessPartnerId: {
                      entityFields: ["BusinessPartner"],
                    },
                    paddedBusinessPartnerId: {
                      entityFields: ["BusinessPartner"],
                      transforms: [{ type: "PAD_LEFT", length: 10, character: "0" }],
                    },
                  },
                },
              },
              {
                name: "Contact",
                syncStrategy: {
                  type: "REPLICATE_RELATIONSHIP",
                  profileRelationshipTypeId: relationshipTypes["p_contact__contacted_via"].id,
                  parentProfileRelationshipSide: "RIGHT",
                  entityMappingIndex: 1,
                  missingRemoteRelationshipStrategy: "DELETE_RELATIONSHIP",
                },
                fetchStrategy: {
                  type: "FROM_ENTITY_SET",
                  entityDefinition: {
                    servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
                    serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
                    entitySetName: "ProjectSet",
                    remoteEntityKey: ["ProjectID"],
                  },
                  filter: {
                    operator: "and",
                    conditions: [
                      {
                        left: { type: "property", name: "Customer" },
                        operator: "eq",
                        right: { type: "literal", value: "'{{businessPartnerId}}'" },
                      },
                      {
                        left: { type: "property", name: "YY1_PRACTICEGROUP_Cpr" },
                        operator: "ne",
                        right: { type: "literal", value: "''" },
                      },
                    ],
                  },
                  filterParams: {
                    businessPartnerId: {
                      entityFields: ["BusinessPartner"],
                    },
                  },
                },
              },
            ],
          },
          {
            name: "Individuals",
            entityDefinition: {
              servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
              serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
              entitySetName: "ProjectSet",
              remoteEntityKey: ["ProjectID"],
            },
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [individualFields["p_tax_id"].id],
            },
            profileTypeId: individual.id,
            initialSyncOrderBy: [
              ["CreatedOn", "asc"],
              ["ProjectID", "asc"],
            ],
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "ChangedOn",
              },
            },
            filter: {
              left: { type: "property", name: "Customer" },
              operator: "ne",
              right: { type: "literal", value: "'3'" },
            },
            fieldMappings: [
              {
                remoteEntityFields: ["ProjectName"],
                profileTypeFieldIds: [individualFields["p_tax_id"].id],
                direction: "TO_LOCAL",
              },
              {
                remoteEntityFields: ["ProjectName"],
                direction: "TO_LOCAL",
                profileTypeFieldIds: [individualFields["p_first_name"].id],
              },
            ],
            relationshipMappings: [
              {
                name: "p_contract__counterparty",
                syncStrategy: {
                  type: "REPLICATE_RELATIONSHIP",
                  entityMappingIndex: 2,
                  profileRelationshipTypeId: relationshipTypes["p_contract__counterparty"].id,
                  parentProfileRelationshipSide: "RIGHT",
                  missingRemoteRelationshipStrategy: "IGNORE",
                },
                fetchStrategy: {
                  type: "FROM_ENTITY_SET",
                  entityDefinition: {
                    servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
                    serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
                    entitySetName: "ProjectSet",
                    remoteEntityKey: ["ProjectID"],
                  },
                },
              },
            ],
          },
          {
            name: "Contracts",
            profileTypeId: contract.id,
            entityDefinition: {
              servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
              serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
              entitySetName: "ProjectSet",
              remoteEntityKey: ["ProjectID"],
            },
            fieldMappings: [
              {
                direction: "BOTH",
                remoteEntityFields: ["YY1_ServiceType_Cpr"],
                profileTypeFieldIds: [contractFields["p_contract_type"].id],
              },
            ],
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [
                contractFields["p_counterparty"].id,
                contractFields["p_contract_type"].id,
              ],
            },
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "CreatedOn",
              },
            },
            initialSyncOrderBy: [["CreatedOn", "asc"]],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).resolves.not.toThrow();

    client.assertNoMoreCalls();
  });

  it("validates literal parameters in filter exists in filterParams", async () => {
    client.setNextExpectedCalls(
      ([["getMetadata", "sap/API_BUSINESS_PARTNER"]] as const).map(([method, servicePath]) => [
        method,
        [servicePath],
        readFileSync(join(__dirname, `./odata/responses/${servicePath}/$metadata.xml`), "utf-8"),
      ]),
    );

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
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
                  filter: {
                    left: { type: "property", name: "Country" },
                    operator: "eq",
                    right: { type: "literal", value: "'{{county}}'" },
                  },
                  filterParams: {
                    country: {
                      entityFields: ["BusinessPartner"],
                    },
                  },
                },
              },
            ],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].relationshipMappings[0].fetchStrategy.filter.right.value",
      message: "literal '{{county}}' is not defined in filterParams",
    });

    client.assertNoMoreCalls();
  });

  it("validates profileFilter in mapping", async () => {
    client.setNextExpectedCalls([
      [
        "getMetadata",
        ["CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV"],
        readFileSync(
          join(__dirname, `./odata/responses/CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV/$metadata.xml`),
          "utf-8",
        ),
      ],
    ]);

    await expect(
      validator.validate(organization.id, {
        authorization: {
          type: "BASIC",
          user: "XXX",
          password: "XXX",
        },
        mappings: [
          {
            name: "Contracts",
            profileTypeId: contract.id,
            profileFilter: {
              logicalOperator: "AND",
              conditions: [
                {
                  profileTypeFieldId: contractFields["p_contract_type"].id,
                  operator: "EQUAL",
                  value: "1",
                },
                {
                  profileTypeFieldId: 1234,
                  operator: "EQUAL",
                  value: "1",
                },
              ],
            },
            entityDefinition: {
              servicePath: "CPD/SC_PROJ_ENGMT_CREATE_UPD_SRV",
              serviceNamespace: "CPD.SC_PROJ_ENGMT_CREATE_UPD_SRV",
              entitySetName: "ProjectSet",
              remoteEntityKey: ["ProjectID"],
            },
            fieldMappings: [
              {
                direction: "BOTH",
                remoteEntityFields: ["YY1_ServiceType_Cpr"],
                profileTypeFieldIds: [contractFields["p_contract_type"].id],
              },
            ],
            remoteEntityKeyBinding: {
              profileTypeFieldIds: [contractFields["p_counterparty"].id],
            },
            changeDetection: {
              type: "POLLING",
              remoteLastChange: {
                type: "DATETIME",
                field: "CreatedOn",
              },
            },
            initialSyncOrderBy: [["CreatedOn", "asc"]],
          },
        ],
        baseUrl: "https://sap.com",
      }),
    ).rejects.toMatchObject({
      path: "mappings[0].profileFilter.conditions[1].profileTypeFieldId",
      message: "Field not found",
    });

    client.assertNoMoreCalls();
  });
});
