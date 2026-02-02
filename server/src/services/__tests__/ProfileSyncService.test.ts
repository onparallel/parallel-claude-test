import { gql } from "graphql-request";
import { Knex } from "knex";
import { indexBy, range } from "remeda";
import {
  Organization,
  OrgIntegration,
  ProfileRelationshipType,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { initServer, TestClient } from "../../graphql/__tests__/server";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { IProfilesSetupService, PROFILES_SETUP_SERVICE } from "../ProfilesSetupService";
import { PROFILE_SYNC_SERVICE, ProfileSyncService } from "../ProfileSyncService";

describe("ProfileSyncService", () => {
  let mocks: Mocks;
  let testClient: TestClient;

  let organization: Organization;

  let profileSync: ProfileSyncService;

  let individual: ProfileType;
  let individualFields: Record<string, ProfileTypeField>;
  let legalEntity: ProfileType;
  let legalEntityFields: Record<string, ProfileTypeField>;
  let contract: ProfileType;
  let contractFields: Record<string, ProfileTypeField>;

  let relationships: Record<string, ProfileRelationshipType>;

  let syncIntegration: OrgIntegration;

  let user: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization } = await mocks.createSessionUserAndOrganization());

    profileSync = testClient.container.get<ProfileSyncService>(PROFILE_SYNC_SERVICE);
    const profilesSetup = testClient.container.get<IProfilesSetupService>(PROFILES_SETUP_SERVICE);
    await profilesSetup.createDefaultProfileTypes(organization.id, "TEST");
    await profilesSetup.createContractProfileType(
      { org_id: organization.id, name: { en: "Contract" }, name_plural: { en: "Contracts" } },
      "TEST",
    );
    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);

    [individual] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "INDIVIDUAL",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");

    [user] = await mocks.createRandomUsers(organization.id, 1, undefined, () => ({
      email: "john.doe@onparallel.com",
      first_name: "John",
      last_name: "Doe",
    }));

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

    [legalEntity] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "LEGAL_ENTITY",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");
    const _legalEntityFields = await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: legalEntity.id,
        deleted_at: null,
      })
      .select("*");
    legalEntityFields = indexBy(_legalEntityFields, (f) => f.alias!);

    [contract] = await mocks.knex
      .from("profile_type")
      .where({
        standard_type: "CONTRACT",
        org_id: organization.id,
        deleted_at: null,
      })
      .select("*");
    const _contractFields = await mocks.knex
      .from("profile_type_field")
      .where({
        profile_type_id: contract.id,
        deleted_at: null,
      })
      .select("*");
    contractFields = indexBy(_contractFields, (f) => f.alias!);

    const _relationships = await mocks.knex
      .from("profile_relationship_type")
      .where({ org_id: organization.id, deleted_at: null })
      .select("*");
    relationships = indexBy(_relationships, (r) => r.alias!);

    [syncIntegration] = await mocks.knex.from("org_integration").insert(
      {
        org_id: organization.id,
        is_enabled: true,
        type: "PROFILE_SYNC",
        provider: "SAP",
        settings: {},
        name: "SAP",
      },
      "*",
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("writeIntoDatabase", () => {
    describe("on empty state", () => {
      afterEach(async () => {
        await mocks.knex.from("profile_field_value").update({ deleted_at: new Date() });
        await mocks.knex.from("profile").update({ deleted_at: new Date() });
        await mocks.knex.from("profile_relationship").update({ deleted_at: new Date() });
      });

      it("should create and update profiles and their relationships", async () => {
        await profileSync.writeIntoDatabase(
          [
            {
              profileTypeId: individual.id,
              matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
              data: [
                [individualFields["p_tax_id"].id, "1234567890"],
                [individualFields["p_first_name"].id, "John"],
                [individualFields["p_last_name"].id, "Doe"],
                [individualFields["p_email"].id, "john.doe@example.com"],
                [individualFields["p_gender"].id, "M"],
                [individualFields["p_birth_date"].id, "1990-01-01"],
                [individualFields["p_phone_number"].id, "+34611611611"],
                [individualFields["p_address"].id, "123 Main St"],
                [individualFields["p_city"].id, "Anytown"],
                [individualFields["p_zip"].id, "12345"],
                [individualFields["p_country_of_residence"].id, "US"],
                [individualFields["p_risk"].id, "LOW"],
                [individualFields["assigned_user"].id, "john.doe@onparallel.com"],
              ],
              relationshipGroups: [
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId: relationships["p_parent__child"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: individual.id,
                      matchBy: [[individualFields["p_tax_id"].id, "9876543210"]],
                      data: [
                        [individualFields["p_tax_id"].id, "9876543210"],
                        [individualFields["p_first_name"].id, "Jane"],
                        [individualFields["p_last_name"].id, "Doe"],
                        [individualFields["p_email"].id, "jane.doe@example.com"],
                        [individualFields["p_gender"].id, "F"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId:
                      relationships["p_legal_representative__legally_represented"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: legalEntity.id,
                      matchBy: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                      ],
                      data: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                        [legalEntityFields["p_registration_number"].id, "9876543210"],
                        [legalEntityFields["p_registered_address"].id, "123 Main St"],
                        [legalEntityFields["p_city"].id, "Anytown"],
                        [legalEntityFields["p_zip"].id, "12345"],
                        [legalEntityFields["p_country_of_incorporation"].id, "US"],
                        [legalEntityFields["p_date_of_incorporation"].id, "1990-01-01"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "RIGHT",
                    profileRelationshipTypeId: relationships["p_contract__counterparty"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: contract.id,
                      matchBy: [
                        [contractFields["p_counterparty"].id, "John Doe Inc."],
                        [contractFields["p_contract_type"].id, "EMPLOYMENT_CONTRACT"],
                      ],
                      data: [
                        [contractFields["p_counterparty"].id, "John Doe Inc."],
                        [contractFields["p_contract_type"].id, "EMPLOYMENT_CONTRACT"],
                        [contractFields["p_effective_date"].id, "2020-01-01"],
                        [contractFields["p_expiration_date"].id, "2022-01-01"],
                        [contractFields["p_jurisdiction"].id, "US"],
                        [contractFields["p_contract_value"].id, 1000000],
                        [contractFields["p_contract_currency"].id, "USD"],
                        [contractFields["p_payment_terms"].id, "NET 30"],
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          organization.id,
          syncIntegration.id,
        );

        const { errors: searchErrors, data: searchData } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $profileTypeFieldId: GID!) {
              profiles(
                limit: 100
                offset: 0
                profileTypeId: $profileTypeId
                filter: {
                  operator: EQUAL
                  profileTypeFieldId: $profileTypeFieldId
                  value: "1234567890"
                }
              ) {
                totalCount
                items {
                  id
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
          },
        );

        expect(searchErrors).toBeUndefined();
        expect(searchData?.profiles).toEqual({
          totalCount: 1,
          items: [{ id: expect.any(String) }],
        });

        const mainProfileId = fromGlobalId(searchData?.profiles?.items?.[0]?.id).id;

        const { errors: mainProfileErrors, data: mainProfileData } = await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                id
                properties {
                  field {
                    alias
                    type
                  }
                  value {
                    content
                  }
                }
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
              }
            }
          `,
          {
            profileId: toGlobalId("Profile", mainProfileId),
          },
        );

        expect(mainProfileErrors).toBeUndefined();
        expect(mainProfileData?.profile).toEqual({
          id: toGlobalId("Profile", mainProfileId),
          properties: [
            {
              field: {
                alias: "p_first_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "John",
                },
              },
            },
            {
              field: {
                alias: "p_last_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Doe",
                },
              },
            },
            {
              field: {
                alias: "p_email",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "john.doe@example.com",
                },
              },
            },
            {
              field: {
                alias: "p_phone_number",
                type: "PHONE",
              },
              value: {
                content: {
                  value: "+34611611611",
                  pretty: "+34 611 61 16 11",
                },
              },
            },
            {
              field: {
                alias: "p_mobile_phone_number",
                type: "PHONE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_birth_date",
                type: "DATE",
              },
              value: {
                content: {
                  value: "1990-01-01",
                },
              },
            },
            {
              field: {
                alias: "p_gender",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "M",
                },
              },
            },
            {
              field: {
                alias: "p_address",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "123 Main St",
                },
              },
            },
            {
              field: {
                alias: "p_city",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Anytown",
                },
              },
            },
            {
              field: {
                alias: "p_zip",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "12345",
                },
              },
            },
            {
              field: {
                alias: "p_country_of_residence",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "US",
                },
              },
            },
            {
              field: {
                alias: "p_proof_of_address_document",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_citizenship",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_tax_id",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "1234567890",
                },
              },
            },
            {
              field: {
                alias: "p_id_document",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_passport_document",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_passport_number",
                type: "SHORT_TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_is_pep",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_risk",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "LOW",
                },
              },
            },
            {
              field: {
                alias: "p_risk_assessment",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_source_of_funds",
                type: "TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_background_check",
                type: "BACKGROUND_CHECK",
              },
              value: null,
            },
            {
              field: {
                alias: "p_occupation",
                type: "SHORT_TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_poa",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_position",
                type: "SHORT_TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_client_status",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_marital_status",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_relationship",
                type: "CHECKBOX",
              },
              value: null,
            },
            {
              field: {
                alias: "assigned_user",
                type: "USER_ASSIGNMENT",
              },
              value: {
                content: {
                  value: toGlobalId("User", user.id),
                  user: {
                    id: toGlobalId("User", user.id),
                    email: "john.doe@onparallel.com",
                    fullName: "John Doe",
                    status: "ACTIVE",
                  },
                },
              },
            },
          ],
          relationships: [
            {
              leftSideProfile: {
                id: toGlobalId("Profile", mainProfileId),
              },
              rightSideProfile: {
                id: expect.any(String),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", mainProfileId),
              },
              rightSideProfile: {
                id: expect.any(String),
              },
              relationshipType: {
                alias: "p_legal_representative__legally_represented",
              },
            },
            {
              leftSideProfile: {
                id: expect.any(String),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", mainProfileId),
              },
              relationshipType: {
                alias: "p_contract__counterparty",
              },
            },
          ],
          events: {
            totalCount: 18,
            items: [
              ...range(0, 3).map(() => ({
                type: "PROFILE_RELATIONSHIP_CREATED",
              })),
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 13).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });

        const childProfileId = fromGlobalId(
          mainProfileData?.profile?.relationships?.[0]?.rightSideProfile?.id,
        ).id;
        const { errors: childProfileErrors, data: childProfileData } = await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                id
                properties(
                  filter: [
                    { alias: "p_tax_id" }
                    { alias: "p_first_name" }
                    { alias: "p_last_name" }
                    { alias: "p_email" }
                    { alias: "p_gender" }
                  ]
                ) {
                  field {
                    alias
                    type
                  }
                  value {
                    content
                  }
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
              }
            }
          `,
          {
            profileId: toGlobalId("Profile", childProfileId),
          },
        );

        expect(childProfileErrors).toBeUndefined();
        expect(childProfileData?.profile).toEqual({
          id: toGlobalId("Profile", childProfileId),
          properties: [
            {
              field: {
                alias: "p_first_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Jane",
                },
              },
            },
            {
              field: {
                alias: "p_last_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Doe",
                },
              },
            },
            {
              field: {
                alias: "p_email",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "jane.doe@example.com",
                },
              },
            },
            {
              field: {
                alias: "p_gender",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "F",
                },
              },
            },
            {
              field: {
                alias: "p_tax_id",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "9876543210",
                },
              },
            },
          ],
          events: {
            totalCount: 8,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 5).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });

        const legallyRepresentedProfileId = fromGlobalId(
          mainProfileData?.profile?.relationships?.[1]?.rightSideProfile?.id,
        ).id;
        const { errors: legallyRepresentedProfileErrors, data: legallyRepresentedProfileData } =
          await testClient.execute(
            gql`
              query ($profileId: GID!) {
                profile(profileId: $profileId) {
                  id
                  properties(
                    filter: [
                      { alias: "p_entity_name" }
                      { alias: "p_entity_type" }
                      { alias: "p_registration_number" }
                      { alias: "p_registered_address" }
                      { alias: "p_city" }
                      { alias: "p_zip" }
                      { alias: "p_country_of_incorporation" }
                      { alias: "p_date_of_incorporation" }
                    ]
                  ) {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                  }
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                    }
                  }
                }
              }
            `,
            {
              profileId: toGlobalId("Profile", legallyRepresentedProfileId),
            },
          );

        expect(legallyRepresentedProfileErrors).toBeUndefined();
        expect(legallyRepresentedProfileData?.profile).toEqual({
          id: toGlobalId("Profile", legallyRepresentedProfileId),
          properties: [
            {
              field: {
                alias: "p_entity_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "John Doe Inc.",
                },
              },
            },
            {
              field: {
                alias: "p_entity_type",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "INCORPORATED",
                },
              },
            },
            {
              field: {
                alias: "p_registration_number",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "9876543210",
                },
              },
            },
            {
              field: {
                alias: "p_registered_address",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "123 Main St",
                },
              },
            },
            {
              field: {
                alias: "p_city",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Anytown",
                },
              },
            },
            {
              field: {
                alias: "p_zip",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "12345",
                },
              },
            },
            {
              field: {
                alias: "p_country_of_incorporation",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "US",
                },
              },
            },
            {
              field: {
                alias: "p_date_of_incorporation",
                type: "DATE",
              },
              value: {
                content: {
                  value: "1990-01-01",
                },
              },
            },
          ],
          events: {
            totalCount: 11,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 8).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });

        const contractProfileId = fromGlobalId(
          mainProfileData?.profile?.relationships?.[2]?.leftSideProfile?.id,
        ).id;
        const { errors: contractProfileErrors, data: contractProfileData } =
          await testClient.execute(
            gql`
              query ($profileId: GID!) {
                profile(profileId: $profileId) {
                  id
                  properties(
                    filter: [
                      { alias: "p_counterparty" }
                      { alias: "p_contract_type" }
                      { alias: "p_effective_date" }
                      { alias: "p_expiration_date" }
                      { alias: "p_jurisdiction" }
                      { alias: "p_contract_value" }
                      { alias: "p_contract_currency" }
                      { alias: "p_payment_terms" }
                    ]
                  ) {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                  }
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                    }
                  }
                }
              }
            `,
            {
              profileId: toGlobalId("Profile", contractProfileId),
            },
          );

        expect(contractProfileErrors).toBeUndefined();
        expect(contractProfileData?.profile).toEqual({
          id: toGlobalId("Profile", contractProfileId),
          properties: [
            {
              field: {
                alias: "p_counterparty",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "John Doe Inc.",
                },
              },
            },
            {
              field: {
                alias: "p_contract_type",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "EMPLOYMENT_CONTRACT",
                },
              },
            },
            {
              field: {
                alias: "p_effective_date",
                type: "DATE",
              },
              value: {
                content: {
                  value: "2020-01-01",
                },
              },
            },
            {
              field: {
                alias: "p_expiration_date",
                type: "DATE",
              },
              value: {
                content: {
                  value: "2022-01-01",
                },
              },
            },
            {
              field: {
                alias: "p_jurisdiction",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "US",
                },
              },
            },
            {
              field: {
                alias: "p_contract_value",
                type: "NUMBER",
              },
              value: {
                content: {
                  value: 1000000,
                },
              },
            },
            {
              field: {
                alias: "p_contract_currency",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "USD",
                },
              },
            },
            {
              field: {
                alias: "p_payment_terms",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "NET 30",
                },
              },
            },
          ],
          events: {
            totalCount: 11,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 8).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });
      });

      it("logs error and skips the value if a validation error occurs", async () => {
        const logger = jest.spyOn(profileSync["logger"], "warn");

        await expect(
          profileSync.writeIntoDatabase(
            [
              {
                profileTypeId: individual.id,
                matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
                data: [
                  [individualFields["p_tax_id"].id, "1234567890"],
                  [individualFields["p_first_name"].id, "John"],
                  [individualFields["p_last_name"].id, "Doe"],
                ],
                relationshipGroups: [
                  {
                    syncStrategy: {
                      parentProfileRelationshipSide: "LEFT",
                      missingRemoteRelationshipStrategy: "IGNORE",
                      profileRelationshipTypeId:
                        relationships["p_legal_representative__legally_represented"].id,
                    },
                    syncData: [
                      {
                        profileTypeId: legalEntity.id,
                        matchBy: [
                          [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                          [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                        ],
                        data: [
                          [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                          [legalEntityFields["p_entity_type"].id, "INVALID_ENTITY_TYPE"], // !!!!! invalid type
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            organization.id,
            syncIntegration.id,
          ),
        ).resolves.not.toThrow();

        expect(logger).toHaveBeenLastCalledWith(
          `Error validating profile field value: Value is not a valid option. field: ${legalEntityFields["p_entity_type"].id}; alias: p_entity_type; type: SELECT; value: "INVALID_ENTITY_TYPE"`,
        );

        await expect(
          profileSync.writeIntoDatabase(
            [
              {
                profileTypeId: individual.id,
                matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
                data: [
                  [individualFields["p_tax_id"].id, "1234567890"],
                  [individualFields["p_country_of_residence"].id, "UNKNOWN"], // !!!!! invalid country
                  [individualFields["p_risk"].id, "LOW"],
                ],
              },
            ],
            organization.id,
            syncIntegration.id,
          ),
        ).resolves.not.toThrow();

        expect(logger).toHaveBeenLastCalledWith(
          `Error validating profile field value: Value is not a valid option. field: ${individualFields["p_country_of_residence"].id}; alias: p_country_of_residence; type: SELECT; value: "UNKNOWN"`,
        );

        await expect(
          profileSync.writeIntoDatabase(
            [
              {
                profileTypeId: individual.id,
                matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
                data: [
                  [individualFields["p_tax_id"].id, "1234567890"],
                  [individualFields["p_first_name"].id, "John"],
                  [individualFields["p_last_name"].id, "Doe"],
                  [individualFields["p_email"].id, "john.doe@example.com"],
                  [individualFields["p_gender"].id, "M"],
                  [individualFields["p_birth_date"].id, "ABC123"], // !!!!! invalid date
                ],
              },
            ],
            organization.id,
            syncIntegration.id,
          ),
        ).resolves.not.toThrow();

        expect(logger).toHaveBeenLastCalledWith(
          `Error validating profile field value: Value is not a valid date. field: ${individualFields["p_birth_date"].id}; alias: p_birth_date; type: DATE; value: "ABC123"`,
        );

        const dbProfiles = await mocks.knex
          .from("profile")
          .where({ org_id: organization.id, deleted_at: null })
          .orderBy("id", "asc");

        expect(dbProfiles).toMatchObject([
          {
            id: expect.any(Number),
            profile_type_id: individual.id,
            deleted_at: null,
            localizable_name: {
              en: "John Doe",
              es: "John Doe",
            },
            status: "OPEN",
            value_cache: {
              [individualFields["p_tax_id"].id]: { content: { value: "1234567890" } },
              [individualFields["p_first_name"].id]: { content: { value: "John" } },
              [individualFields["p_last_name"].id]: { content: { value: "Doe" } },
              [individualFields["p_email"].id]: { content: { value: "john.doe@example.com" } },
              [individualFields["p_gender"].id]: { content: { value: "M" } },
              [individualFields["p_risk"].id]: { content: { value: "LOW" } },
            },
          },
          {
            id: expect.any(Number),
            profile_type_id: legalEntity.id,
            deleted_at: null,
            localizable_name: {
              en: "John Doe Inc.",
              es: "John Doe Inc.",
            },
            status: "OPEN",
            value_cache: {
              [legalEntityFields["p_entity_name"].id]: { content: { value: "John Doe Inc." } },
              [legalEntityFields["p_entity_type"].id]: { content: { value: "INCORPORATED" } },
            },
          },
        ]);

        const dbRelationships = await mocks.knex
          .from("profile_relationship")
          .where({ org_id: organization.id, deleted_at: null });
        expect(dbRelationships).toMatchObject([
          {
            created_by_integration_id: syncIntegration.id,
            left_side_profile_id: dbProfiles[0].id,
            right_side_profile_id: dbProfiles[1].id,
            profile_relationship_type_id:
              relationships["p_legal_representative__legally_represented"].id,
          },
        ]);

        const dbProfileFieldValues = await mocks.knex
          .from("profile_field_value")
          .where({ deleted_at: null });
        expect(dbProfileFieldValues).toHaveLength(8);
      });
    });

    describe("on non empty state", () => {
      afterEach(async () => {
        await mocks.knex.from("profile_relationship").update({ deleted_at: new Date() });
        await mocks.knex.from("profile_field_value").update({ deleted_at: new Date() });
        await mocks.knex.from("profile").update({ deleted_at: new Date() });
      });

      beforeEach(async () => {
        await profileSync.writeIntoDatabase(
          [
            {
              profileTypeId: individual.id,
              matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
              data: [
                [individualFields["p_tax_id"].id, "1234567890"],
                [individualFields["p_first_name"].id, "John"],
                [individualFields["p_last_name"].id, "Doe"],
                [individualFields["p_email"].id, "john.doe@example.com"],
                [individualFields["p_gender"].id, "M"],
                [individualFields["p_birth_date"].id, "1990-01-01"],
                [individualFields["p_phone_number"].id, "+34611611611"],
                [individualFields["p_address"].id, "123 Main St"],
                [individualFields["p_city"].id, "Anytown"],
                [individualFields["p_zip"].id, "12345"],
                [individualFields["p_country_of_residence"].id, "US"],
                [individualFields["p_risk"].id, "LOW"],
              ],
              relationshipGroups: [
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId: relationships["p_parent__child"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: individual.id,
                      matchBy: [[individualFields["p_tax_id"].id, "9876543210"]],
                      data: [
                        [individualFields["p_tax_id"].id, "9876543210"],
                        [individualFields["p_first_name"].id, "Jane"],
                        [individualFields["p_last_name"].id, "Doe"],
                        [individualFields["p_email"].id, "jane.doe@example.com"],
                        [individualFields["p_gender"].id, "F"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId:
                      relationships["p_legal_representative__legally_represented"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: legalEntity.id,
                      matchBy: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                      ],
                      data: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                        [legalEntityFields["p_registration_number"].id, "9876543210"],
                        [legalEntityFields["p_registered_address"].id, "123 Main St"],
                        [legalEntityFields["p_city"].id, "Anytown"],
                        [legalEntityFields["p_zip"].id, "12345"],
                        [legalEntityFields["p_country_of_incorporation"].id, "US"],
                        [legalEntityFields["p_date_of_incorporation"].id, "1990-01-01"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "RIGHT",
                    profileRelationshipTypeId: relationships["p_contract__counterparty"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: contract.id,
                      matchBy: [
                        [contractFields["p_counterparty"].id, "John Doe Inc."],
                        [contractFields["p_contract_type"].id, "EMPLOYMENT_CONTRACT"],
                      ],
                      data: [
                        [contractFields["p_counterparty"].id, "John Doe Inc."],
                        [contractFields["p_contract_type"].id, "EMPLOYMENT_CONTRACT"],
                        [contractFields["p_effective_date"].id, "2020-01-01"],
                        [contractFields["p_expiration_date"].id, "2022-01-01"],
                        [contractFields["p_jurisdiction"].id, "US"],
                        [contractFields["p_contract_value"].id, 1000000],
                        [contractFields["p_contract_currency"].id, "USD"],
                        [contractFields["p_payment_terms"].id, "NET 30"],
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          organization.id,
          syncIntegration.id,
        );
      });

      it("should do nothing if sync data is the same as stored in db", async () => {
        await profileSync.writeIntoDatabase(
          [
            {
              profileTypeId: individual.id,
              matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
              data: [
                [individualFields["p_tax_id"].id, "1234567890"],
                [individualFields["p_first_name"].id, "John"],
                [individualFields["p_last_name"].id, "Doe"],
                [individualFields["p_email"].id, "john.doe@example.com"],
                [individualFields["p_gender"].id, "M"],
                [individualFields["p_birth_date"].id, "1990-01-01"],
                [individualFields["p_phone_number"].id, "+34611611611"],
                [individualFields["p_address"].id, "123 Main St"],
                [individualFields["p_city"].id, "Anytown"],
                [individualFields["p_zip"].id, "12345"],
                [individualFields["p_country_of_residence"].id, "US"],
                [individualFields["p_risk"].id, "LOW"],
              ],
              relationshipGroups: [
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId: relationships["p_parent__child"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: individual.id,
                      matchBy: [[individualFields["p_tax_id"].id, "9876543210"]],
                      data: [
                        [individualFields["p_tax_id"].id, "9876543210"],
                        [individualFields["p_first_name"].id, "Jane"],
                        [individualFields["p_last_name"].id, "Doe"],
                        [individualFields["p_email"].id, "jane.doe@example.com"],
                        [individualFields["p_gender"].id, "F"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId:
                      relationships["p_legal_representative__legally_represented"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: legalEntity.id,
                      matchBy: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                      ],
                      data: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                        [legalEntityFields["p_registration_number"].id, "9876543210"],
                        [legalEntityFields["p_registered_address"].id, "123 Main St"],
                        [legalEntityFields["p_city"].id, "Anytown"],
                        [legalEntityFields["p_zip"].id, "12345"],
                        [legalEntityFields["p_country_of_incorporation"].id, "US"],
                        [legalEntityFields["p_date_of_incorporation"].id, "1990-01-01"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "RIGHT",
                    profileRelationshipTypeId: relationships["p_contract__counterparty"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: contract.id,
                      matchBy: [
                        [contractFields["p_counterparty"].id, "John Doe Inc."],
                        [contractFields["p_contract_type"].id, "EMPLOYMENT_CONTRACT"],
                      ],
                      data: [
                        [contractFields["p_counterparty"].id, "John Doe Inc."],
                        [contractFields["p_contract_type"].id, "EMPLOYMENT_CONTRACT"],
                        [contractFields["p_effective_date"].id, "2020-01-01"],
                        [contractFields["p_expiration_date"].id, "2022-01-01"],
                        [contractFields["p_jurisdiction"].id, "US"],
                        [contractFields["p_contract_value"].id, 1000000],
                        [contractFields["p_contract_currency"].id, "USD"],
                        [contractFields["p_payment_terms"].id, "NET 30"],
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          organization.id,
          syncIntegration.id,
        );

        const { errors: searchErrors, data: searchData } = await testClient.execute(
          gql`
            query ($profileTypeId: GID!, $profileTypeFieldId: GID!) {
              profiles(
                limit: 100
                offset: 0
                profileTypeId: $profileTypeId
                filter: {
                  operator: EQUAL
                  profileTypeFieldId: $profileTypeFieldId
                  value: "1234567890"
                }
              ) {
                totalCount
                items {
                  id
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", individual.id),
            profileTypeFieldId: toGlobalId("ProfileTypeField", individualFields["p_tax_id"].id),
          },
        );

        expect(searchErrors).toBeUndefined();
        expect(searchData?.profiles).toEqual({
          totalCount: 1,
          items: [{ id: expect.any(String) }],
        });

        const mainProfileId = fromGlobalId(searchData?.profiles?.items?.[0]?.id).id;

        const { errors: mainProfileErrors, data: mainProfileData } = await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                id
                properties {
                  field {
                    alias
                    type
                  }
                  value {
                    content
                  }
                }
                relationships {
                  leftSideProfile {
                    id
                  }
                  rightSideProfile {
                    id
                  }
                  relationshipType {
                    alias
                  }
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
              }
            }
          `,
          {
            profileId: toGlobalId("Profile", mainProfileId),
          },
        );

        expect(mainProfileErrors).toBeUndefined();
        expect(mainProfileData?.profile).toEqual({
          id: toGlobalId("Profile", mainProfileId),
          properties: [
            {
              field: {
                alias: "p_first_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "John",
                },
              },
            },
            {
              field: {
                alias: "p_last_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Doe",
                },
              },
            },
            {
              field: {
                alias: "p_email",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "john.doe@example.com",
                },
              },
            },
            {
              field: {
                alias: "p_phone_number",
                type: "PHONE",
              },
              value: {
                content: {
                  value: "+34611611611",
                  pretty: "+34 611 61 16 11",
                },
              },
            },
            {
              field: {
                alias: "p_mobile_phone_number",
                type: "PHONE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_birth_date",
                type: "DATE",
              },
              value: {
                content: {
                  value: "1990-01-01",
                },
              },
            },
            {
              field: {
                alias: "p_gender",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "M",
                },
              },
            },
            {
              field: {
                alias: "p_address",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "123 Main St",
                },
              },
            },
            {
              field: {
                alias: "p_city",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Anytown",
                },
              },
            },
            {
              field: {
                alias: "p_zip",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "12345",
                },
              },
            },
            {
              field: {
                alias: "p_country_of_residence",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "US",
                },
              },
            },
            {
              field: {
                alias: "p_proof_of_address_document",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_citizenship",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_tax_id",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "1234567890",
                },
              },
            },
            {
              field: {
                alias: "p_id_document",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_passport_document",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_passport_number",
                type: "SHORT_TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_is_pep",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_risk",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "LOW",
                },
              },
            },
            {
              field: {
                alias: "p_risk_assessment",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_source_of_funds",
                type: "TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_background_check",
                type: "BACKGROUND_CHECK",
              },
              value: null,
            },
            {
              field: {
                alias: "p_occupation",
                type: "SHORT_TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_poa",
                type: "FILE",
              },
              value: null,
            },
            {
              field: {
                alias: "p_position",
                type: "SHORT_TEXT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_client_status",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_marital_status",
                type: "SELECT",
              },
              value: null,
            },
            {
              field: {
                alias: "p_relationship",
                type: "CHECKBOX",
              },
              value: null,
            },
            {
              field: {
                alias: "assigned_user",
                type: "USER_ASSIGNMENT",
              },
              value: null,
            },
          ],
          relationships: [
            {
              leftSideProfile: {
                id: toGlobalId("Profile", mainProfileId),
              },
              rightSideProfile: {
                id: expect.any(String),
              },
              relationshipType: {
                alias: "p_parent__child",
              },
            },
            {
              leftSideProfile: {
                id: toGlobalId("Profile", mainProfileId),
              },
              rightSideProfile: {
                id: expect.any(String),
              },
              relationshipType: {
                alias: "p_legal_representative__legally_represented",
              },
            },
            {
              leftSideProfile: {
                id: expect.any(String),
              },
              rightSideProfile: {
                id: toGlobalId("Profile", mainProfileId),
              },
              relationshipType: {
                alias: "p_contract__counterparty",
              },
            },
          ],
          events: {
            totalCount: 17,
            items: [
              ...range(0, 3).map(() => ({
                type: "PROFILE_RELATIONSHIP_CREATED",
              })),
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 12).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });

        const childProfileId = fromGlobalId(
          mainProfileData?.profile?.relationships?.[0]?.rightSideProfile?.id,
        ).id;
        const { errors: childProfileErrors, data: childProfileData } = await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                id
                properties(
                  filter: [
                    { alias: "p_tax_id" }
                    { alias: "p_first_name" }
                    { alias: "p_last_name" }
                    { alias: "p_email" }
                    { alias: "p_gender" }
                  ]
                ) {
                  field {
                    alias
                    type
                  }
                  value {
                    content
                  }
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
              }
            }
          `,
          {
            profileId: toGlobalId("Profile", childProfileId),
          },
        );

        expect(childProfileErrors).toBeUndefined();
        expect(childProfileData?.profile).toEqual({
          id: toGlobalId("Profile", childProfileId),
          properties: [
            {
              field: {
                alias: "p_first_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Jane",
                },
              },
            },
            {
              field: {
                alias: "p_last_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Doe",
                },
              },
            },
            {
              field: {
                alias: "p_email",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "jane.doe@example.com",
                },
              },
            },
            {
              field: {
                alias: "p_gender",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "F",
                },
              },
            },
            {
              field: {
                alias: "p_tax_id",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "9876543210",
                },
              },
            },
          ],
          events: {
            totalCount: 8,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 5).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });

        const legallyRepresentedProfileId = fromGlobalId(
          mainProfileData?.profile?.relationships?.[1]?.rightSideProfile?.id,
        ).id;
        const { errors: legallyRepresentedProfileErrors, data: legallyRepresentedProfileData } =
          await testClient.execute(
            gql`
              query ($profileId: GID!) {
                profile(profileId: $profileId) {
                  id
                  properties(
                    filter: [
                      { alias: "p_entity_name" }
                      { alias: "p_entity_type" }
                      { alias: "p_registration_number" }
                      { alias: "p_registered_address" }
                      { alias: "p_city" }
                      { alias: "p_zip" }
                      { alias: "p_country_of_incorporation" }
                      { alias: "p_date_of_incorporation" }
                    ]
                  ) {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                  }
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                    }
                  }
                }
              }
            `,
            {
              profileId: toGlobalId("Profile", legallyRepresentedProfileId),
            },
          );

        expect(legallyRepresentedProfileErrors).toBeUndefined();
        expect(legallyRepresentedProfileData?.profile).toEqual({
          id: toGlobalId("Profile", legallyRepresentedProfileId),
          properties: [
            {
              field: {
                alias: "p_entity_name",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "John Doe Inc.",
                },
              },
            },
            {
              field: {
                alias: "p_entity_type",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "INCORPORATED",
                },
              },
            },
            {
              field: {
                alias: "p_registration_number",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "9876543210",
                },
              },
            },
            {
              field: {
                alias: "p_registered_address",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "123 Main St",
                },
              },
            },
            {
              field: {
                alias: "p_city",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "Anytown",
                },
              },
            },
            {
              field: {
                alias: "p_zip",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "12345",
                },
              },
            },
            {
              field: {
                alias: "p_country_of_incorporation",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "US",
                },
              },
            },
            {
              field: {
                alias: "p_date_of_incorporation",
                type: "DATE",
              },
              value: {
                content: {
                  value: "1990-01-01",
                },
              },
            },
          ],
          events: {
            totalCount: 11,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 8).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });

        const contractProfileId = fromGlobalId(
          mainProfileData?.profile?.relationships?.[2]?.leftSideProfile?.id,
        ).id;
        const { errors: contractProfileErrors, data: contractProfileData } =
          await testClient.execute(
            gql`
              query ($profileId: GID!) {
                profile(profileId: $profileId) {
                  id
                  properties(
                    filter: [
                      { alias: "p_counterparty" }
                      { alias: "p_contract_type" }
                      { alias: "p_effective_date" }
                      { alias: "p_expiration_date" }
                      { alias: "p_jurisdiction" }
                      { alias: "p_contract_value" }
                      { alias: "p_contract_currency" }
                      { alias: "p_payment_terms" }
                    ]
                  ) {
                    field {
                      alias
                      type
                    }
                    value {
                      content
                    }
                  }
                  events(limit: 100, offset: 0) {
                    totalCount
                    items {
                      type
                    }
                  }
                }
              }
            `,
            {
              profileId: toGlobalId("Profile", contractProfileId),
            },
          );

        expect(contractProfileErrors).toBeUndefined();
        expect(contractProfileData?.profile).toEqual({
          id: toGlobalId("Profile", contractProfileId),
          properties: [
            {
              field: {
                alias: "p_counterparty",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "John Doe Inc.",
                },
              },
            },
            {
              field: {
                alias: "p_contract_type",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "EMPLOYMENT_CONTRACT",
                },
              },
            },
            {
              field: {
                alias: "p_effective_date",
                type: "DATE",
              },
              value: {
                content: {
                  value: "2020-01-01",
                },
              },
            },
            {
              field: {
                alias: "p_expiration_date",
                type: "DATE",
              },
              value: {
                content: {
                  value: "2022-01-01",
                },
              },
            },
            {
              field: {
                alias: "p_jurisdiction",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "US",
                },
              },
            },
            {
              field: {
                alias: "p_contract_value",
                type: "NUMBER",
              },
              value: {
                content: {
                  value: 1000000,
                },
              },
            },
            {
              field: {
                alias: "p_contract_currency",
                type: "SELECT",
              },
              value: {
                content: {
                  value: "USD",
                },
              },
            },
            {
              field: {
                alias: "p_payment_terms",
                type: "SHORT_TEXT",
              },
              value: {
                content: {
                  value: "NET 30",
                },
              },
            },
          ],
          events: {
            totalCount: 11,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 8).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });
      });

      it("should sync only differences and remove relationships that are not present in sync data when strategy=DELETE_RELATIONSHIP", async () => {
        await profileSync.writeIntoDatabase(
          [
            {
              profileTypeId: individual.id,
              matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
              data: [
                [individualFields["p_tax_id"].id, "1234567890"],
                [individualFields["p_first_name"].id, "John"],
                [individualFields["p_last_name"].id, "Doe"],
                [individualFields["p_email"].id, "john.doe@example.com"],
                [individualFields["p_gender"].id, "M"],
                [individualFields["p_birth_date"].id, "1990-01-01"],
                [individualFields["p_phone_number"].id, "+34611611611"],
                [individualFields["p_address"].id, "123 Main St"],
                [individualFields["p_city"].id, "Anytown"],
                [individualFields["p_zip"].id, "12345"],
                [individualFields["p_country_of_residence"].id, "US"],
                [individualFields["p_risk"].id, "HIGH"],
              ],
              relationshipGroups: [
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId: relationships["p_parent__child"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: individual.id,
                      matchBy: [[individualFields["p_tax_id"].id, "9876543210"]],
                      data: [
                        [individualFields["p_tax_id"].id, "9876543210"],
                        [individualFields["p_first_name"].id, "Jane"],
                        [individualFields["p_last_name"].id, "Doe"],
                        [individualFields["p_email"].id, "jane.doe@example.com"],
                        [individualFields["p_gender"].id, "F"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId:
                      relationships["p_legal_representative__legally_represented"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: legalEntity.id,
                      matchBy: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                      ],
                      data: [
                        [legalEntityFields["p_entity_name"].id, "John Doe Inc."],
                        [legalEntityFields["p_entity_type"].id, "INCORPORATED"],
                        [legalEntityFields["p_registration_number"].id, "9876543210"],
                        [legalEntityFields["p_registered_address"].id, "123 Main St"],
                        [legalEntityFields["p_city"].id, "Anytown"],
                        [legalEntityFields["p_zip"].id, "12345"],
                        [legalEntityFields["p_country_of_incorporation"].id, "US"],
                        [legalEntityFields["p_date_of_incorporation"].id, "1990-01-01"],
                      ],
                    },
                  ],
                },
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "DELETE_RELATIONSHIP",
                    parentProfileRelationshipSide: "RIGHT",
                    profileRelationshipTypeId: relationships["p_contract__counterparty"].id,
                  },
                  syncData: [],
                },
              ],
            },
          ],
          organization.id,
          syncIntegration.id,
        );

        const pfvs = await mocks.knex
          .from("profile_field_value")
          .where({
            profile_type_field_id: individualFields["p_tax_id"].id,
            deleted_at: null,
            removed_at: null,
          })
          .select("*");

        const johnDoeProfileId = pfvs.find((v) => v.content.value === "1234567890")!.profile_id;

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
              }
            }
          `,
          {
            profileId: toGlobalId("Profile", johnDoeProfileId),
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profile).toEqual({
          id: toGlobalId("Profile", johnDoeProfileId),
          events: {
            totalCount: 20,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_REMOVED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
              },
              ...range(0, 3).map(() => ({
                type: "PROFILE_RELATIONSHIP_CREATED",
              })),
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 12).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });
      });

      it("should sync only differences and keep relationships that are not present in sync data when strategy=IGNORE", async () => {
        await profileSync.writeIntoDatabase(
          [
            {
              profileTypeId: individual.id,
              matchBy: [[individualFields["p_tax_id"].id, "9876543210"]],
              data: [
                [individualFields["p_tax_id"].id, "9876543210"],
                [individualFields["p_first_name"].id, "Jane H."],
                [individualFields["p_last_name"].id, "Doe"],
                [individualFields["p_email"].id, "jane.doe@example.com"],
                [individualFields["p_gender"].id, "F"],
              ],
              relationshipGroups: [
                {
                  syncStrategy: {
                    missingRemoteRelationshipStrategy: "IGNORE",
                    parentProfileRelationshipSide: "LEFT",
                    profileRelationshipTypeId: relationships["p_family_member"].id,
                  },
                  syncData: [
                    {
                      profileTypeId: individual.id,
                      matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
                      data: [],
                    },
                  ],
                },
              ],
            },
          ],
          organization.id,
          syncIntegration.id,
        );

        const pfvs = await mocks.knex
          .from("profile_field_value")
          .where({
            profile_type_field_id: individualFields["p_tax_id"].id,
            deleted_at: null,
            removed_at: null,
          })
          .select("*");

        const janeProfileId = pfvs.find((v) => v.content.value === "9876543210")!.profile_id;

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                id
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
              }
            }
          `,
          {
            profileId: toGlobalId("Profile", janeProfileId),
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.profile).toEqual({
          id: toGlobalId("Profile", janeProfileId),
          events: {
            totalCount: 11,
            items: [
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              {
                type: "PROFILE_FIELD_VALUE_UPDATED",
              },
              {
                type: "PROFILE_RELATIONSHIP_CREATED",
              },
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 5).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });
      });

      it("should do nothing with current relationships when relationships array is empty or undefined", async () => {
        await profileSync.writeIntoDatabase(
          [
            {
              profileTypeId: individual.id,
              matchBy: [[individualFields["p_tax_id"].id, "1234567890"]],
              data: [],
            },
          ],
          organization.id,
          syncIntegration.id,
        );

        const pfvs = await mocks.knex
          .from("profile_field_value")
          .where({
            profile_type_field_id: individualFields["p_tax_id"].id,
            deleted_at: null,
            removed_at: null,
          })
          .select("*");

        const janeProfileId = pfvs.find((v) => v.content.value === "1234567890")!.profile_id;

        const { errors, data } = await testClient.execute(
          gql`
            query ($profileId: GID!) {
              profile(profileId: $profileId) {
                id
                relationships {
                  id
                }
                events(limit: 100, offset: 0) {
                  totalCount
                  items {
                    type
                  }
                }
              }
            }
          `,
          { profileId: toGlobalId("Profile", janeProfileId) },
        );

        expect(errors).toBeUndefined();
        expect(data?.profile).toEqual({
          id: toGlobalId("Profile", janeProfileId),
          relationships: expect.toBeArrayOfSize(3),
          events: {
            totalCount: 17,
            items: [
              ...range(0, 3).map(() => ({
                type: "PROFILE_RELATIONSHIP_CREATED",
              })),
              {
                type: "PROFILE_UPDATED",
              },
              ...range(0, 12).map(() => ({
                type: "PROFILE_FIELD_VALUE_UPDATED",
              })),
              {
                type: "PROFILE_CREATED",
              },
            ],
          },
        });
      });
    });
  });
});
