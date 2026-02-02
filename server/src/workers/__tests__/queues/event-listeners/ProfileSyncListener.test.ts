import { readFileSync } from "fs";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { join } from "path";
import { indexBy } from "remeda";
import { noop } from "ts-essentials";
import { MockSapOdataClient } from "../../../../../test/mocks";
import {
  Organization,
  OrgIntegration,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../../../db/__types";
import { ProfileUpdatedEvent } from "../../../../db/events/ProfileEvent";
import { KNEX } from "../../../../db/knex";
import { Mocks } from "../../../../db/repositories/__tests__/mocks";
import { initServer, TestClient } from "../../../../graphql/__tests__/server";
import { SAP_ODATA_CLIENT } from "../../../../integrations/profile-sync/sap/SapOdataClient";
import {
  SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
  SapProfileSyncIntegrationFactory,
} from "../../../../integrations/profile-sync/sap/SapProfileSyncIntegration";
import {
  IIntegrationsSetupService,
  INTEGRATIONS_SETUP_SERVICE,
} from "../../../../services/IntegrationsSetupService";
import { ILogger, LOGGER } from "../../../../services/Logger";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
} from "../../../../services/ProfilesSetupService";
import { fromGlobalId, toGlobalId } from "../../../../util/globalId";
import {
  PROFILE_SYNC_LISTENER,
  ProfileSyncListener,
} from "../../../queues/event-listeners/ProfileSyncListener";

describe("Worker - Profile Sync Listener", () => {
  let knex: Knex;
  let mocks: Mocks;

  let testClient: TestClient;
  let client: MockSapOdataClient;

  let organization: Organization;

  let individual: ProfileType;
  let individualFields: Record<string, ProfileTypeField>;

  let user: User;

  beforeAll(async () => {
    testClient = await initServer();

    client = testClient.container.get<MockSapOdataClient>(SAP_ODATA_CLIENT);

    await testClient.container.unbind(LOGGER);
    testClient.container.bind<ILogger>(LOGGER).toConstantValue({
      log: noop,
      info: noop,
      warn: noop,
      error: noop,
      debug: noop,
    });

    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([
      { name: "PROFILES", default_value: true },
      { name: "PROFILE_SYNC", default_value: true },
    ]);

    await testClient.container
      .get<IProfilesSetupService>(PROFILES_SETUP_SERVICE)
      .createDefaultProfileTypes(organization.id, "TEST");

    [individual] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "INDIVIDUAL",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");

    await mocks.createRandomProfileTypeFields(organization.id, individual.id, 1, () => ({
      type: "USER_ASSIGNMENT",
      alias: "assigned_user",
    }));

    const _individualFields = await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: individual.id,
        deleted_at: null,
      })
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

    [user] = await mocks.createRandomUsers(organization.id, 1, undefined, () => ({
      email: "johndoe@onparallel.com",
    }));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("remote updates", () => {
    afterEach(async () => {
      await mocks.knex.from("profile_field_value").update({ deleted_at: new Date() });
      await mocks.knex.from("profile").update({ deleted_at: new Date() });
    });

    describe("with simple mapping and no relationships", () => {
      let orgIntegration: OrgIntegration;
      beforeAll(async () => {
        client.setNextExpectedCalls([
          [
            "getMetadata",
            ["sap/API_BUSINESS_PARTNER"],
            readFileSync(
              join(
                __dirname,
                `../../../../../src/integrations/profile-sync/sap/__tests__/odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`,
              ),
              "utf-8",
            ),
          ],
        ]);
        await mocks.knex.from("org_integration").update({ deleted_at: new Date() });
        orgIntegration = await testClient.container
          .get<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE)
          .createSapProfileSyncIntegration(
            {
              org_id: organization.id,
              name: "SAP",
              settings: {
                baseUrl: "https://test.com",
                mappings: [
                  {
                    name: "BusinessPartner to Individual",
                    entityDefinition: {
                      servicePath: "sap/API_BUSINESS_PARTNER",
                      serviceNamespace: "API_BUSINESS_PARTNER",
                      entitySetName: "A_BusinessPartner",
                      remoteEntityKey: ["BusinessPartner"],
                    },
                    remoteEntityKeyBinding: {
                      profileTypeFieldIds: [individualFields["p_tax_id"].id],
                    },
                    changeDetection: {
                      type: "POLLING",
                      remoteLastChange: { type: "DATETIME", field: "CreationDate" },
                    },
                    initialSyncOrderBy: [
                      ["CreationDate", "asc"],
                      ["CreationTime", "asc"],
                      ["BusinessPartnerUUID", "asc"],
                    ],
                    profileTypeId: individual.id,
                    profileFilter: {
                      operator: "HAS_VALUE",
                      profileTypeFieldId: individualFields["p_tax_id"].id,
                    },
                    fieldMappings: [
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_first_name"].id],
                        remoteEntityFields: ["FirstName"],
                      },
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_last_name"].id],
                        remoteEntityFields: ["LastName"],
                      },
                      {
                        direction: "TO_LOCAL",
                        profileTypeFieldIds: [individualFields["p_gender"].id],
                        remoteEntityFields: ["IsMale"],
                        toLocalTransforms: [
                          {
                            type: "MAP",
                            map: [
                              { from: "true", to: "M" },
                              { from: "false", to: "F" },
                            ],
                          },
                        ],
                        toRemoteTransforms: [
                          {
                            type: "MAP",
                            map: [
                              { from: "M", to: "true" },
                              { from: "F", to: "false" },
                            ],
                          },
                        ],
                      },
                      {
                        direction: "BOTH",
                        profileTypeFieldIds: [individualFields["assigned_user"].id],
                        remoteEntityFields: ["BusinessPartnerCategory"],
                      },
                    ],
                  },
                ],
                CREDENTIALS: {
                  type: "BASIC",
                  user: "XXX",
                  password: "XXX",
                },
              },
            },
            "TEST",
          );

        client.assertNoMoreCalls();
      });

      beforeEach(async () => {
        await mocks.knex.from("profile_sync_log").delete();
        await mocks.knex.from("profile_sync_log").insert({
          sync_type: "INITIAL",
          status: "COMPLETED",
          integration_id: orgIntegration.id,
          output: { output: "DATABASE" },
        });
      });

      it("do not trigger remote updates if there is no INITIAL sync log", async () => {
        await mocks.knex.from("profile_sync_log").delete();
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "1234567890" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_gender"].id),
                content: { value: "M" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);

        client.assertNoMoreCalls();
      });

      it("sends updateEntity request call to SAP client when a profile is updated", async () => {
        const [profile] = await mocks.createRandomProfiles(organization.id, individual.id, 1);
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileId: GID!, $fields: [UpdateProfileFieldValueInput!]!) {
              updateProfileFieldValue(profileId: $profileId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileId: toGlobalId("Profile", profile.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "1234567890" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_gender"].id),
                content: { value: "M" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["assigned_user"].id,
                ),
                content: { value: toGlobalId("User", user.id) },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.updateProfileFieldValue).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.updateProfileFieldValue.id).id)
          .where("id", fromGlobalId(data?.updateProfileFieldValue.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              { BusinessPartner: "1234567890" },
              {
                $select: ["BusinessPartner", "BusinessPartnerCategory"],
              },
            ],
            {
              BusinessPartner: "1234567890",
              BusinessPartnerCategory: "",
            },
          ],
          [
            "updateEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              { BusinessPartner: "1234567890" },
              {
                FirstName: "John",
                LastName: "Doe",
                BusinessPartnerCategory: "johndoe@onparallel.com",
              },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);

        client.assertNoMoreCalls();
      });

      it("does not retrigger a sync if the event was caused by the same sync service that triggered it", async () => {
        const factory = testClient.container.get<SapProfileSyncIntegrationFactory>(
          SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
        );

        const syncIntegration = factory(orgIntegration.id);

        client.setNextExpectedCalls([
          [
            "getEntitySet",
            [
              {
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              {
                $select: ["BusinessPartner", "IsMale", "BusinessPartnerCategory"],
                $orderby: [
                  ["CreationDate", "asc"],
                  ["CreationTime", "asc"],
                  ["BusinessPartnerUUID", "asc"],
                ],
              },
            ],
            {
              results: [
                {
                  BusinessPartner: "JOHN_DOE_1234567890",
                  IsMale: "true",
                  BusinessPartnerCategory: null,
                },
              ],
            },
          ],
        ]);
        await syncIntegration.initialSync();

        client.assertNoMoreCalls();

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $filter: ProfileQueryFilterInput) {
              profiles(limit: 1, offset: 0, profileTypeId: $profileTypeId, filter: $filter) {
                totalCount
                items {
                  id
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      id
                      type
                      data
                    }
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            filter: {
              profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
              operator: "EQUAL",
              value: "JOHN_DOE_1234567890",
            },
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profiles).toEqual({
          totalCount: 1,
          items: [
            {
              id: expect.any(String),
              events: {
                totalCount: 4,
                items: [
                  {
                    id: expect.any(String),
                    type: "PROFILE_UPDATED",
                    data: expect.objectContaining({
                      integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
                      profileTypeFieldIds: expect.toIncludeSameMembers([
                        toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                        toGlobalId("ProfileTypeField", individualFields["p_gender"].id),
                      ]),
                    }),
                  },
                  {
                    id: expect.any(String),
                    type: "PROFILE_FIELD_VALUE_UPDATED",
                    data: expect.objectContaining({
                      integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
                      profileTypeFieldId: toGlobalId(
                        "ProfileTypeField",
                        individualFields["p_tax_id"].id,
                      ),
                    }),
                  },
                  {
                    id: expect.any(String),
                    type: "PROFILE_FIELD_VALUE_UPDATED",
                    data: expect.objectContaining({
                      integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
                      profileTypeFieldId: toGlobalId(
                        "ProfileTypeField",
                        individualFields["p_gender"].id,
                      ),
                    }),
                  },
                  {
                    id: expect.any(String),
                    type: "PROFILE_CREATED",
                    data: expect.objectContaining({
                      integrationId: toGlobalId("OrgIntegration", orgIntegration.id),
                    }),
                  },
                ],
              },
            },
          ],
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.profiles.items[0].id).id)
          .where("id", fromGlobalId(data?.profiles.items[0].events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([]);
        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);

        client.assertNoMoreCalls();
      });

      it("does nothing if a profile is created and not found in remote", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "abcdefghijk" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_gender"].id),
                content: { value: "M" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              { BusinessPartner: "abcdefghijk" },
              { $select: ["BusinessPartner"] },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);

        client.assertNoMoreCalls();
      });
    });

    describe("with EMBED_INTO_PARENT/FROM_NAVIGATION_PROPERTY", () => {
      beforeAll(async () => {
        client.setNextExpectedCalls([
          [
            "getMetadata",
            ["sap/API_BUSINESS_PARTNER"],
            readFileSync(
              join(
                __dirname,
                `../../../../../src/integrations/profile-sync/sap/__tests__/odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`,
              ),
              "utf-8",
            ),
          ],
        ]);
        await mocks.knex.from("org_integration").update({ deleted_at: new Date() });
        const orgIntegration = await testClient.container
          .get<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE)
          .createSapProfileSyncIntegration(
            {
              org_id: organization.id,
              name: "SAP",
              settings: {
                baseUrl: "https://test.com",
                mappings: [
                  {
                    name: "BusinessPartner to Individual",
                    entityDefinition: {
                      servicePath: "sap/API_BUSINESS_PARTNER",
                      serviceNamespace: "API_BUSINESS_PARTNER",
                      entitySetName: "A_BusinessPartner",
                      remoteEntityKey: ["BusinessPartner"],
                    },
                    remoteEntityKeyBinding: {
                      profileTypeFieldIds: [individualFields["p_tax_id"].id],
                    },
                    changeDetection: {
                      type: "POLLING",
                      remoteLastChange: { type: "DATETIME", field: "CreationDate" },
                    },
                    initialSyncOrderBy: [
                      ["CreationDate", "asc"],
                      ["CreationTime", "asc"],
                      ["BusinessPartnerUUID", "asc"],
                    ],
                    profileTypeId: individual.id,
                    profileFilter: {
                      operator: "HAS_VALUE",
                      profileTypeFieldId: individualFields["p_tax_id"].id,
                    },
                    fieldMappings: [
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_first_name"].id],
                        remoteEntityFields: ["FirstName"],
                      },
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_last_name"].id],
                        remoteEntityFields: ["LastName"],
                      },
                    ],
                    relationshipMappings: [
                      {
                        name: "to_EmailAddress",
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
                        syncStrategy: {
                          type: "EMBED_INTO_PARENT",
                          fieldMappings: [
                            {
                              remoteEntityFields: ["StreetName"],
                              profileTypeFieldIds: [individualFields["p_address"].id],
                              direction: "BOTH",
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
                CREDENTIALS: {
                  type: "BASIC",
                  user: "XXX",
                  password: "XXX",
                },
              },
            },
            "TEST",
          );

        client.assertNoMoreCalls();

        await mocks.knex.from("profile_sync_log").insert({
          sync_type: "INITIAL",
          status: "COMPLETED",
          integration_id: orgIntegration.id,
          output: { output: "DATABASE" },
        });
      });

      it("updates the entity in remote", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "ABC123" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_address"].id,
                ),
                content: { value: "123 Main St" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              { BusinessPartner: "ABC123" },
              {
                $select: [
                  "BusinessPartner",
                  "to_BusinessPartnerAddress/BusinessPartner",
                  "to_BusinessPartnerAddress/AddressID",
                  "to_BusinessPartnerAddress/StreetName",
                ],
                $expand: ["to_BusinessPartnerAddress"],
              },
            ],
            {
              BusinessPartner: "ABC123",
              to_BusinessPartnerAddress: {
                results: [
                  {
                    BusinessPartner: "ABC123",
                    AddressID: "ADDRESS_ID",
                    StreetName: "1",
                  },
                ],
              },
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
              { BusinessPartner: "ABC123" },
              { FirstName: "John", LastName: "Doe" },
            ],
            null,
          ],
          [
            "updateEntity",
            [
              {
                entitySetName: "A_BusinessPartnerAddress",
                remoteEntityKey: ["BusinessPartner", "AddressID"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              { BusinessPartner: "ABC123", AddressID: "ADDRESS_ID" },
              { StreetName: "123 Main St" },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);
        client.assertNoMoreCalls();
      });
    });

    describe("with EMBED_INTO_PARENT/FROM_ENTITY", () => {
      beforeAll(async () => {
        client.setNextExpectedCalls([
          [
            "getMetadata",
            ["sap/API_BUSINESS_PARTNER"],
            readFileSync(
              join(
                __dirname,
                `../../../../../src/integrations/profile-sync/sap/__tests__/odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`,
              ),
              "utf-8",
            ),
          ],
        ]);
        await mocks.knex.from("org_integration").update({ deleted_at: new Date() });
        const orgIntegration = await testClient.container
          .get<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE)
          .createSapProfileSyncIntegration(
            {
              org_id: organization.id,
              name: "SAP",
              settings: {
                baseUrl: "https://test.com",
                mappings: [
                  {
                    name: "BusinessPartner to Individual",
                    entityDefinition: {
                      servicePath: "sap/API_BUSINESS_PARTNER",
                      serviceNamespace: "API_BUSINESS_PARTNER",
                      entitySetName: "A_BusinessPartner",
                      remoteEntityKey: ["BusinessPartner"],
                    },
                    remoteEntityKeyBinding: {
                      profileTypeFieldIds: [individualFields["p_tax_id"].id],
                    },
                    changeDetection: {
                      type: "POLLING",
                      remoteLastChange: { type: "DATETIME", field: "CreationDate" },
                    },
                    initialSyncOrderBy: [
                      ["CreationDate", "asc"],
                      ["CreationTime", "asc"],
                      ["BusinessPartnerUUID", "asc"],
                    ],
                    profileTypeId: individual.id,
                    profileFilter: {
                      operator: "HAS_VALUE",
                      profileTypeFieldId: individualFields["p_tax_id"].id,
                    },
                    fieldMappings: [
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_first_name"].id],
                        remoteEntityFields: ["FirstName"],
                      },
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_last_name"].id],
                        remoteEntityFields: ["LastName"],
                      },
                    ],
                    relationshipMappings: [
                      {
                        name: "to_EmailAddress",
                        fetchStrategy: {
                          type: "FROM_ENTITY",
                          entityDefinition: {
                            servicePath: "sap/API_BUSINESS_PARTNER",
                            serviceNamespace: "API_BUSINESS_PARTNER",
                            entitySetName: "A_AddressEmailAddress",
                            remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                          },
                          key: {
                            AddressID: {
                              entityFields: ["FirstName"],
                              transforms: [
                                { type: "MAP", map: [{ from: "John", to: "John_Address_ID" }] },
                              ],
                            },
                            Person: {
                              entityFields: ["LastName"],
                              transforms: [
                                { type: "MAP", map: [{ from: "Doe", to: "John_Person" }] },
                              ],
                            },
                            OrdinalNumber: { entityFields: ["Supplier"] },
                          },
                        },
                        syncStrategy: {
                          type: "EMBED_INTO_PARENT",
                          fieldMappings: [
                            {
                              remoteEntityFields: ["EmailAddress"],
                              profileTypeFieldIds: [individualFields["p_email"].id],
                              direction: "BOTH",
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
                CREDENTIALS: {
                  type: "BASIC",
                  user: "XXX",
                  password: "XXX",
                },
              },
            },
            "TEST",
          );

        client.assertNoMoreCalls();

        await mocks.knex.from("profile_sync_log").insert({
          sync_type: "INITIAL",
          status: "COMPLETED",
          integration_id: orgIntegration.id,
          output: { output: "DATABASE" },
        });
      });

      it("updates the entity in remote", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "ABC123" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_email"].id),
                content: { value: "john.doe@example.com" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              { BusinessPartner: "ABC123" },
              { $select: ["BusinessPartner", "FirstName", "LastName", "Supplier"] },
            ],
            {
              BusinessPartner: "ABC123",
              FirstName: "John",
              LastName: "Doe",
              Supplier: "SUP",
            },
          ],
          [
            "getEntity",
            [
              {
                entitySetName: "A_AddressEmailAddress",
                remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              {
                AddressID: "John_Address_ID",
                Person: "John_Person",
                OrdinalNumber: "SUP",
              },
              { $select: ["AddressID", "Person", "OrdinalNumber", "EmailAddress"] },
            ],
            {
              AddressID: "John_Address_ID",
              Person: "John_Person",
              OrdinalNumber: "SUP",
              EmailAddress: "old@example.com",
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
              { BusinessPartner: "ABC123" },
              { FirstName: "John", LastName: "Doe" },
            ],
            null,
          ],
          [
            "updateEntity",
            [
              {
                entitySetName: "A_AddressEmailAddress",
                remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              { AddressID: "John_Address_ID", Person: "John_Person", OrdinalNumber: "SUP" },
              { EmailAddress: "john.doe@example.com" },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);
        client.assertNoMoreCalls();
      });

      it("does not update relationship FROM_ENTITY if the full entity key cannot be built", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "ABC123" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_email"].id),
                content: { value: "john.doe@example.com" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              { BusinessPartner: "ABC123" },
              { $select: ["BusinessPartner", "FirstName", "LastName", "Supplier"] },
            ],
            {
              BusinessPartner: "ABC123",
              FirstName: "John",
              LastName: "Doe",
              Supplier: null,
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
              { BusinessPartner: "ABC123" },
              { FirstName: "John", LastName: "Doe" },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);
        client.assertNoMoreCalls();
      });

      it("does not update relationship FROM_ENTITY if the entity is not found", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "ABC123" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_email"].id),
                content: { value: "john.doe@example.com" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              { BusinessPartner: "ABC123" },
              { $select: ["BusinessPartner", "FirstName", "LastName", "Supplier"] },
            ],
            {
              BusinessPartner: "ABC123",
              FirstName: "John",
              LastName: "Doe",
              Supplier: "UNKNOWN",
            },
          ],
          [
            "getEntity",
            [
              {
                entitySetName: "A_AddressEmailAddress",
                remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              {
                AddressID: "John_Address_ID",
                Person: "John_Person",
                OrdinalNumber: "UNKNOWN",
              },
              { $select: ["AddressID", "Person", "OrdinalNumber", "EmailAddress"] },
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
              { BusinessPartner: "ABC123" },
              { FirstName: "John", LastName: "Doe" },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);
        client.assertNoMoreCalls();
      });
    });

    describe("with EMBED_INTO_PARENT/FROM_ENTITY_SET", () => {
      beforeAll(async () => {
        client.setNextExpectedCalls([
          [
            "getMetadata",
            ["sap/API_BUSINESS_PARTNER"],
            readFileSync(
              join(
                __dirname,
                `../../../../../src/integrations/profile-sync/sap/__tests__/odata/responses/sap/API_BUSINESS_PARTNER/$metadata.xml`,
              ),
              "utf-8",
            ),
          ],
        ]);
        await mocks.knex.from("org_integration").update({ deleted_at: new Date() });
        const orgIntegration = await testClient.container
          .get<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE)
          .createSapProfileSyncIntegration(
            {
              org_id: organization.id,
              name: "SAP",
              settings: {
                baseUrl: "https://test.com",
                mappings: [
                  {
                    name: "BusinessPartner to Individual",
                    entityDefinition: {
                      servicePath: "sap/API_BUSINESS_PARTNER",
                      serviceNamespace: "API_BUSINESS_PARTNER",
                      entitySetName: "A_BusinessPartner",
                      remoteEntityKey: ["BusinessPartner"],
                    },
                    remoteEntityKeyBinding: {
                      profileTypeFieldIds: [individualFields["p_tax_id"].id],
                    },
                    changeDetection: {
                      type: "POLLING",
                      remoteLastChange: { type: "DATETIME", field: "CreationDate" },
                    },
                    initialSyncOrderBy: [
                      ["CreationDate", "asc"],
                      ["CreationTime", "asc"],
                      ["BusinessPartnerUUID", "asc"],
                    ],
                    profileTypeId: individual.id,
                    profileFilter: {
                      operator: "HAS_VALUE",
                      profileTypeFieldId: individualFields["p_tax_id"].id,
                    },
                    fieldMappings: [
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_first_name"].id],
                        remoteEntityFields: ["FirstName"],
                      },
                      {
                        direction: "TO_REMOTE",
                        profileTypeFieldIds: [individualFields["p_last_name"].id],
                        remoteEntityFields: ["LastName"],
                      },
                    ],
                    relationshipMappings: [
                      {
                        name: "to_EmailAddress",
                        fetchStrategy: {
                          type: "FROM_ENTITY_SET",
                          entityDefinition: {
                            servicePath: "sap/API_BUSINESS_PARTNER",
                            serviceNamespace: "API_BUSINESS_PARTNER",
                            entitySetName: "A_AddressEmailAddress",
                            remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                          },
                          filter: {
                            left: { type: "property", name: "IsDefaultEmailAddress" },
                            operator: "eq",
                            right: { type: "literal", value: "true" },
                          },
                        },
                        syncStrategy: {
                          type: "EMBED_INTO_PARENT",
                          fieldMappings: [
                            {
                              remoteEntityFields: ["EmailAddress"],
                              profileTypeFieldIds: [individualFields["p_email"].id],
                              direction: "BOTH",
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
                CREDENTIALS: {
                  type: "BASIC",
                  user: "XXX",
                  password: "XXX",
                },
              },
            },
            "TEST",
          );

        client.assertNoMoreCalls();

        await mocks.knex.from("profile_sync_log").insert({
          sync_type: "INITIAL",
          status: "COMPLETED",
          integration_id: orgIntegration.id,
          output: { output: "DATABASE" },
        });
      });

      it("updates a property defined in a relationship mapping FROM_ENTITY_SET", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "1234567890" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_email"].id),
                content: { value: "john.doe@example.com" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              { BusinessPartner: "1234567890" },
              { $select: ["BusinessPartner"] },
            ],
            { BusinessPartner: "1234567890" },
          ],
          [
            "getEntitySet",
            [
              {
                entitySetName: "A_AddressEmailAddress",
                remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              {
                $filter: {
                  left: { type: "property", name: "IsDefaultEmailAddress" },
                  operator: "eq",
                  right: { type: "literal", value: "true" },
                },
                $select: ["AddressID", "Person", "OrdinalNumber", "EmailAddress"],
              },
            ],
            {
              results: [
                {
                  AddressID: "ADDRESS_123",
                  Person: "PERSON_123",
                  OrdinalNumber: "1",
                  EmailAddress: "",
                },
              ],
            },
          ],
          [
            "updateEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              { BusinessPartner: "1234567890" },
              { FirstName: "John", LastName: "Doe" },
            ],
            null,
          ],
          [
            "updateEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_AddressEmailAddress",
                remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
              },
              { AddressID: "ADDRESS_123", Person: "PERSON_123", OrdinalNumber: "1" },
              { EmailAddress: "john.doe@example.com" },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);
        client.assertNoMoreCalls();
      });

      it("updates a property defined in a relationship mapping FROM_ENTITY_SET even if it already is the same as in the profile", async () => {
        const { errors, data } = await testClient.execute(
          gql`
            mutation ($profileTypeId: GID!, $fields: [CreateProfileFieldValueInput!]!) {
              createProfile(profileTypeId: $profileTypeId, fields: $fields) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    id
                    type
                  }
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            fields: [
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
                content: { value: "1234567890" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_first_name"].id,
                ),
                content: { value: "John" },
              },
              {
                profileTypeFieldId: toGlobalId(
                  "ProfileTypeField",
                  individualFields["p_last_name"].id,
                ),
                content: { value: "Doe" },
              },
              {
                profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_email"].id),
                content: { value: "john.doe@example.com" },
              },
            ],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfile).toEqual({
          id: expect.any(String),
          events: {
            totalCount: 6,
            items: [
              { id: expect.any(String), type: "PROFILE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_FIELD_VALUE_UPDATED" },
              { id: expect.any(String), type: "PROFILE_CREATED" },
            ],
          },
        });

        const [dbEvent] = await mocks.knex
          .from("profile_event")
          .where("profile_id", fromGlobalId(data?.createProfile.id).id)
          .where("id", fromGlobalId(data?.createProfile.events.items[0].id).id)
          .select("*");

        expect(dbEvent.type).toBe("PROFILE_UPDATED");

        client.setNextExpectedCalls([
          [
            "getEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              { BusinessPartner: "1234567890" },
              { $select: ["BusinessPartner"] },
            ],
            { BusinessPartner: "1234567890" },
          ],
          [
            "getEntitySet",
            [
              {
                entitySetName: "A_AddressEmailAddress",
                remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
                serviceNamespace: "API_BUSINESS_PARTNER",
                servicePath: "sap/API_BUSINESS_PARTNER",
              },
              {
                $filter: {
                  left: { type: "property", name: "IsDefaultEmailAddress" },
                  operator: "eq",
                  right: { type: "literal", value: "true" },
                },
                $select: ["AddressID", "Person", "OrdinalNumber", "EmailAddress"],
              },
            ],
            {
              results: [
                {
                  AddressID: "ADDRESS_123",
                  Person: "PERSON_123",
                  OrdinalNumber: "ORDINAL_1",
                  EmailAddress: "john.doe@example.com",
                },
              ],
            },
          ],
          [
            "updateEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_BusinessPartner",
                remoteEntityKey: ["BusinessPartner"],
              },
              { BusinessPartner: "1234567890" },
              { FirstName: "John", LastName: "Doe" },
            ],
            null,
          ],
          [
            "updateEntity",
            [
              {
                servicePath: "sap/API_BUSINESS_PARTNER",
                serviceNamespace: "API_BUSINESS_PARTNER",
                entitySetName: "A_AddressEmailAddress",
                remoteEntityKey: ["AddressID", "Person", "OrdinalNumber"],
              },
              { AddressID: "ADDRESS_123", Person: "PERSON_123", OrdinalNumber: "ORDINAL_1" },
              { EmailAddress: "john.doe@example.com" },
            ],
            null,
          ],
        ]);

        await testClient.container
          .get<ProfileSyncListener>(PROFILE_SYNC_LISTENER)
          .handle(dbEvent as ProfileUpdatedEvent);
        client.assertNoMoreCalls();
      });
    });
  });
});
