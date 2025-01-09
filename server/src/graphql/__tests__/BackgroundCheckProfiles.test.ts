import { gql } from "graphql-request";
import { Container } from "inversify";
import { Knex } from "knex";
import { pick } from "remeda";
import {
  Organization,
  Profile,
  ProfileFieldValue,
  ProfileType,
  ProfileTypeField,
  User,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  BACKGROUND_CHECK_SERVICE,
  IBackgroundCheckService,
} from "../../services/BackgroundCheckService";
import { toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("Background Check - Profiles", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let container: Container;

  let organization: Organization;
  let user: User;

  function buildToken(params: { profileId: number; profileTypeFieldId: number }) {
    return Buffer.from(
      JSON.stringify({
        profileId: toGlobalId("Profile", params.profileId),
        profileTypeFieldId: toGlobalId("ProfileTypeField", params.profileTypeFieldId),
      }),
    ).toString("base64");
  }

  beforeAll(async () => {
    testClient = await initServer();
    container = testClient.container;
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([
      { name: "PROFILES", default_value: true },
      { name: "BACKGROUND_CHECK", default_value: true },
    ]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("backgroundCheckEntitySearch", () => {
    let backgroundCheckServiceSpy: jest.SpyInstance;
    let profileType: ProfileType;
    let profileTypeField: ProfileTypeField;
    let profile: Profile;

    beforeEach(async () => {
      backgroundCheckServiceSpy = jest.spyOn(
        container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE),
        "entitySearch",
      );

      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      [profileTypeField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({
          type: "BACKGROUND_CHECK",
        }),
      );
      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id);
    });

    afterEach(async () => {
      backgroundCheckServiceSpy.mockClear();
      await mocks.knex.from("profile_event").delete();
      await mocks.knex.from("feature_flag_override").delete();
      await mocks.knex.from("profile_type_field_permission").delete();
    });

    it("completes profile field value when doing a background check search", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({
        totalCount: 2,
        items: [
          {
            id: "Q7747",
            type: "Person",
            name: "Vladimir Vladimirovich PUTIN",
          },
          {
            id: "rupep-company-718",
            type: "Company",
            name: "Putin Consulting LLC",
          },
        ],
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith({
        name: "Vladimir Putin",
        date: null,
        type: null,
        country: null,
      });

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(1);
      expect(pfvs[0]).toMatchObject({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "BACKGROUND_CHECK",
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: null,
          },
          search: {
            totalCount: 2,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
              {
                id: "rupep-company-718",
                type: "Company",
                name: "Putin Consulting LLC",
                properties: {},
              },
            ],
            createdAt: expect.any(String),
          },
          entity: null,
        },
        expiry_date: null,
        removed_at: null,
      });

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("created_at", "desc")
        .select("*");

      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs[0].id,
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("replaces current value when doing a new search", async () => {
      // first search to store value
      await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
        },
      );

      // second search with different query
      const { errors } = await testClient.execute(
        gql`
          query (
            $token: String!
            $name: String!
            $type: BackgroundCheckEntitySearchType
            $country: String
          ) {
            backgroundCheckEntitySearch(
              token: $token
              name: $name
              type: $type
              country: $country
            ) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
          type: "COMPANY",
          country: "RU",
        },
      );

      expect(errors).toBeUndefined();

      expect(backgroundCheckServiceSpy).toHaveBeenCalledTimes(2);
      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(1, {
        name: "Vladimir Putin",
        date: null,
        type: null,
        country: null,
      });
      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(2, {
        name: "Vladimir Putin",
        date: null,
        type: "COMPANY",
        country: "RU",
      });

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(
        pfvs.map(
          pick([
            "profile_id",
            "profile_type_field_id",
            "type",
            "content",
            "expiry_date",
            "removed_at",
            "deleted_at",
          ]),
        ),
      ).toMatchObject([
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: null,
            },
            search: {
              totalCount: 2,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: null,
          },
          expiry_date: null,
          removed_at: expect.any(Date),
          deleted_at: null,
        },
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "COMPANY",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "rupep-company-718",
                  type: "Company",
                  name: "Putin Consulting LLC",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: null,
          },
          expiry_date: null,
          removed_at: null,
          deleted_at: null,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("created_at", "desc")
        .select("*");

      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs[1].id,
            previous_profile_field_value_id: pfvs[0].id,
            alias: null,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs[0].id,
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("returns stored search when doing same search", async () => {
      // first search to store value
      await testClient.execute(
        gql`
          query ($token: String!, $name: String!, $type: BackgroundCheckEntitySearchType) {
            backgroundCheckEntitySearch(token: $token, name: $name, type: $type) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
          type: "PERSON",
        },
      );

      // second search with same query
      const { errors } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!, $type: BackgroundCheckEntitySearchType) {
            backgroundCheckEntitySearch(token: $token, name: $name, type: $type) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
          type: "PERSON",
        },
      );

      expect(errors).toBeUndefined();

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith({
        name: "Vladimir Putin",
        date: null,
        type: "PERSON",
        country: null,
      });

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(1);
      expect(
        pfvs.map(
          pick([
            "profile_id",
            "profile_type_field_id",
            "type",
            "content",
            "expiry_date",
            "removed_at",
            "deleted_at",
          ]),
        ),
      ).toMatchObject([
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: null,
          },
          expiry_date: null,
          removed_at: null,
          deleted_at: null,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("created_at", "desc")
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs[0].id,
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("sends error if user does not have PROFILES feature flag", async () => {
      await mocks.createFeatureFlagOverride("PROFILES", { value: false, org_id: organization.id });

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if profile type field is not BACKGROUND_CHECK", async () => {
      const [ptf] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({ type: "TEXT" }),
      );
      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: ptf.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if used does not have WRITE permissions on field", async () => {
      // reduce default permission to READ
      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "READ",
      });

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if profile is CLOSED", async () => {
      await mocks.knex
        .from("profile")
        .where("id", profile.id)
        .update({ status: "CLOSED", closed_at: new Date() });

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
                type
                name
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("backgroundCheckEntityDetails", () => {
    let backgroundCheckServiceSpy: jest.SpyInstance;
    let profileType: ProfileType;
    let profileTypeField: ProfileTypeField;
    let profile: Profile;

    beforeEach(async () => {
      backgroundCheckServiceSpy = jest.spyOn(
        container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE),
        "entityProfileDetails",
      );

      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      [profileTypeField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({
          type: "BACKGROUND_CHECK",
        }),
      );
      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id);
    });

    afterEach(async () => {
      backgroundCheckServiceSpy.mockClear();
    });

    it("searches in open sanctions when there is no entity stored", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $entityId: String!) {
            backgroundCheckEntityDetails(token: $token, entityId: $entityId) {
              id
              type
              name
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntityDetails).toEqual({
        id: "Q7747",
        type: "Person",
        name: "Vladimir Vladimirovich PUTIN",
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id);
    });

    it("returns stored entity when requesting same entity", async () => {
      await mocks.knex.from("profile_field_value").insert({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: null,
          },
          search: {
            totalCount: 1,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
            ],
            createdAt: new Date().toISOString(),
          },
          entity: {
            id: "Q7747",
            type: "Person",
            name: "Vladimir Vladimirovich PUTIN",
            properties: {},
          },
        },
        type: "BACKGROUND_CHECK",
        created_by_user_id: user.id,
      });

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $entityId: String!) {
            backgroundCheckEntityDetails(token: $token, entityId: $entityId) {
              id
              type
              name
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntityDetails).toEqual({
        id: "Q7747",
        type: "Person",
        name: "Vladimir Vladimirovich PUTIN",
      });

      expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
    });

    it("makes a new search in openSanctions if entity is different", async () => {
      await mocks.knex.from("profile_field_value").insert({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: null,
          },
          search: {
            totalCount: 1,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
            ],
            createdAt: new Date().toISOString(),
          },
          entity: {
            id: "ABCDEF",
            type: "Person",
            name: "ANOTHER ENTITY",
            properties: {},
          },
        },
        type: "BACKGROUND_CHECK",
        created_by_user_id: user.id,
      });

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $entityId: String!) {
            backgroundCheckEntityDetails(token: $token, entityId: $entityId) {
              id
              type
              name
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntityDetails).toEqual({
        id: "Q7747",
        type: "Person",
        name: "Vladimir Vladimirovich PUTIN",
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id);
    });
  });

  describe("updateBackgroundCheckEntity", () => {
    let backgroundCheckServiceSpy: jest.SpyInstance;
    let profileType: ProfileType;
    let profileTypeField: ProfileTypeField;
    let profile: Profile;

    let profileFieldValue: ProfileFieldValue;

    beforeEach(async () => {
      backgroundCheckServiceSpy = jest.spyOn(
        container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE),
        "entityProfileDetails",
      );

      [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      [profileTypeField] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({
          type: "BACKGROUND_CHECK",
        }),
      );
      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id);

      [profileFieldValue] = await mocks.knex
        .from("profile_field_value")
        .insert({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: null,
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
              ],
              createdAt: new Date().toISOString(),
            },
            entity: null,
          },
          type: "BACKGROUND_CHECK",
          created_by_user_id: user.id,
        })
        .returning("*");
    });

    afterEach(async () => {
      backgroundCheckServiceSpy.mockClear();
    });

    it("sends error if profile field value is not found", async () => {
      await mocks.knex.from("profile_field_value").where("id", profileFieldValue.id).delete();

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String!) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toContainGraphQLError("REPLY_NOT_FOUND");
      expect(data).toBeNull();
    });

    it("sends error if profile field value is not BACKGROUND_CHECK", async () => {
      await mocks.knex.from("profile_field_value").where("id", profileFieldValue.id).update({
        type: "TEXT",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String!) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toContainGraphQLError("REPLY_NOT_FOUND");
      expect(data).toBeNull();
    });

    it("updates value with new entity", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String!) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckEntity).toEqual("SUCCESS");

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(pfvs[0]).toMatchObject({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "BACKGROUND_CHECK",
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: null,
          },
          search: {
            totalCount: 1,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
            ],
            createdAt: expect.any(String),
          },
          entity: null,
        },
        expiry_date: null,
        removed_at: expect.any(Date),
      });

      expect(pfvs[1]).toMatchObject({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "BACKGROUND_CHECK",
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: null,
          },
          search: {
            totalCount: 1,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
            ],
            createdAt: expect.any(String),
          },
          entity: {
            id: "Q7747",
            name: "Vladimir Vladimirovich PUTIN",
            type: "Person",
            properties: {},
            createdAt: expect.any(String),
          },
        },
        expiry_date: null,
        removed_at: null,
      });

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("created_at", "desc")
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs[1].id,
            previous_profile_field_value_id: pfvs[0].id,
            alias: null,
          },
        },
      ]);

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id);
    });

    it("removes stored entity when updating with null", async () => {
      await mocks.knex
        .from("profile_field_value")
        .where("id", profileFieldValue.id)
        .update({
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: null,
            },
            search: {
              totalCount: 1,
              items: [
                {
                  id: "Q7747",
                  type: "Person",
                  name: "Vladimir Vladimirovich PUTIN",
                  properties: {},
                },
              ],
              createdAt: new Date().toISOString(),
            },
            entity: {
              id: "Q7747",
              name: "Vladimir Vladimirovich PUTIN",
              type: "Person",
              properties: {},
              createdAt: new Date().toISOString(),
            },
          },
        });

      const { data, errors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: null,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckEntity).toEqual("SUCCESS");

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(pfvs[0]).toMatchObject({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "BACKGROUND_CHECK",
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: null,
          },
          search: {
            totalCount: 1,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
            ],
            createdAt: expect.any(String),
          },
          entity: {
            id: "Q7747",
            name: "Vladimir Vladimirovich PUTIN",
            type: "Person",
            properties: {},
            createdAt: expect.any(String),
          },
        },
        expiry_date: null,
        removed_at: expect.any(Date),
      });

      expect(pfvs[1]).toMatchObject({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "BACKGROUND_CHECK",
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: null,
          },
          search: {
            totalCount: 1,
            items: [
              {
                id: "Q7747",
                type: "Person",
                name: "Vladimir Vladimirovich PUTIN",
                properties: {},
              },
            ],
            createdAt: expect.any(String),
          },
          entity: null,
        },
        expiry_date: null,
        removed_at: null,
      });

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy("created_at", "desc")
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs[1].id,
            previous_profile_field_value_id: pfvs[0].id,
            alias: null,
          },
        },
      ]);

      expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
    });
  });
});
