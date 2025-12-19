import { gql } from "graphql-request";
import { Container } from "inversify";
import { Knex } from "knex";
import { firstBy, pick } from "remeda";
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

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith(
        {
          name: "Vladimir Putin",
          date: null,
          type: null,
          country: null,
          birthCountry: null,
        },
        organization.id,
      );

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
            country: null,
            birthCountry: null,
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
        is_draft: true,
      });

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      // as a draft has been created, no events are sent
      expect(profileEvents).toHaveLength(0);
    });

    it("does not replace current stored value when doing a search with different query", async () => {
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

      await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
        })
        .update({ is_draft: false });

      // second search with different query
      const { errors } = await testClient.execute(
        gql`
          query (
            $token: String!
            $name: String!
            $type: BackgroundCheckEntitySearchType
            $country: String
            $birthCountry: String
          ) {
            backgroundCheckEntitySearch(
              token: $token
              name: $name
              type: $type
              country: $country
              birthCountry: $birthCountry
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
          birthCountry: "GB",
        },
      );

      expect(errors).toBeUndefined();

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith(
        {
          name: "Vladimir Putin",
          date: null,
          type: null,
          country: null,
          birthCountry: null,
        },
        organization.id,
      );

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
            "is_draft",
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
              country: null,
              birthCountry: null,
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
          deleted_at: null,
          is_draft: false,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(0);
    });

    it("replaces current draft value when doing a search with different query and search was not saved", async () => {
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
            $birthCountry: String
          ) {
            backgroundCheckEntitySearch(
              token: $token
              name: $name
              type: $type
              country: $country
              birthCountry: $birthCountry
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
          birthCountry: "GB",
        },
      );

      expect(errors).toBeUndefined();

      expect(backgroundCheckServiceSpy).toHaveBeenCalledTimes(2);

      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(
        1,
        {
          name: "Vladimir Putin",
          date: null,
          type: null,
          country: null,
          birthCountry: null,
        },
        organization.id,
      );

      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(
        2,
        {
          name: "Vladimir Putin",
          date: null,
          type: "COMPANY",
          country: "RU",
          birthCountry: "GB",
        },
        organization.id,
      );

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
            "is_draft",
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
              type: "COMPANY",
              country: "RU",
              birthCountry: "GB",
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
          is_draft: true,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(0);
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

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith(
        {
          name: "Vladimir Putin",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        organization.id,
      );

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
            "is_draft",
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
              country: null,
              birthCountry: null,
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
          is_draft: true,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(0);
    });

    it("forces a search update with same search criteria, triggering new changes", async () => {
      backgroundCheckServiceSpy.mockResolvedValueOnce({
        totalCount: 0,
        items: [],
        createdAt: new Date(),
      });

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

      // save the value
      await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!) {
            saveProfileFieldValueDraft(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            )
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
        },
      );

      // second search with same query and force generates a draft
      const { errors } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!, $type: BackgroundCheckEntitySearchType) {
            backgroundCheckEntitySearch(token: $token, name: $name, type: $type, force: true) {
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

      expect(backgroundCheckServiceSpy).toHaveBeenCalledTimes(2);
      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(
        1,
        {
          name: "Vladimir Putin",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        organization.id,
      );
      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(
        2,
        {
          name: "Vladimir Putin",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        organization.id,
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(3);
      expect(
        pfvs.map(pick(["content", "removed_at", "deleted_at", "is_draft"])),
      ).toIncludeSameMembers([
        {
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
              country: null,
              birthCountry: null,
            },
            search: {
              totalCount: 0,
              items: [],
              createdAt: expect.any(String),
            },
            entity: null,
          },
          removed_at: expect.any(Date),
          deleted_at: null,
          is_draft: true,
        },
        {
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
              country: null,
              birthCountry: null,
            },
            search: {
              totalCount: 0,
              items: [],
              createdAt: expect.any(String),
            },
            entity: null,
          },

          removed_at: null,
          deleted_at: null,
          is_draft: false,
        },
        {
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
              country: null,
              birthCountry: null,
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

          removed_at: null,
          deleted_at: null,
          is_draft: true,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["type"]))).toEqual([
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
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

    it("creates a draft value when a search gives no results", async () => {
      // trigger a search with no results
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
          name: "UNKNOWN",
          type: "PERSON",
        },
      );

      expect(errors).toBeUndefined();

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith(
        {
          name: "UNKNOWN",
          date: null,
          type: "PERSON",
          country: null,
          birthCountry: null,
        },
        organization.id,
      );

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
            "is_draft",
          ]),
        ),
      ).toMatchObject([
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "UNKNOWN",
              date: null,
              type: "PERSON",
              country: null,
              birthCountry: null,
            },
            search: {
              totalCount: 0,
              items: [],
              createdAt: expect.any(String),
            },
            entity: null,
          },
          expiry_date: null,
          removed_at: null,
          deleted_at: null,
          is_draft: true,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(0);
    });

    it("doing a search while having a draft search with no results should overwrite the draft", async () => {
      // trigger first search with results will generate a draft with no results
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
          name: "UNKNOWN",
        },
      );

      // second search with no results
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

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

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
            "is_draft",
          ]),
        ),
      ).toEqual([
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
              country: null,
              birthCountry: null,
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
          is_draft: true,
        },
      ]);
    });

    it("doing a search with results while having a search with no results should overwrite the previous search", async () => {
      // trigger first search with no results
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
          name: "UNKNOWN",
          type: "PERSON",
        },
      );

      // second search with results
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

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

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
            "is_draft",
          ]),
        ),
      ).toEqual([
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          type: "BACKGROUND_CHECK",
          content: {
            query: {
              name: "Vladimir Putin",
              date: null,
              type: "PERSON",
              country: null,
              birthCountry: null,
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
          is_draft: true,
        },
      ]);
    });

    it("forcing a search update should remove false positives that are no longer found in results", async () => {
      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name, force: true) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Putin",
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1?.backgroundCheckEntitySearch).toEqual({
        totalCount: 2,
        items: [{ id: "Q7747" }, { id: "rupep-company-718" }],
      });

      // mark a false positive
      const { errors: updateFalsePositivesErrors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityIds: [String!]!) {
            updateBackgroundCheckSearchFalsePositives(
              token: $token
              entityIds: $entityIds
              isFalsePositive: true
            )
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityIds: ["Q7747", "rupep-company-718"],
        },
      );

      expect(updateFalsePositivesErrors).toBeUndefined();

      // force a search update with less results
      backgroundCheckServiceSpy.mockResolvedValueOnce({
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
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name, force: true) {
              totalCount
              items {
                id
                isFalsePositive
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({
        totalCount: 1,
        items: [{ id: "Q7747", isFalsePositive: true }],
      });

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs.map(pick(["content", "is_draft", "removed_at"]))).toEqual([
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
          is_draft: true,
          removed_at: expect.any(Date),
        },
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
            falsePositives: [
              { id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id },
              { id: "rupep-company-718", addedAt: expect.any(String), addedByUserId: user.id },
            ],
          },
          is_draft: false,
          removed_at: expect.any(Date),
        },
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
            falsePositives: [{ id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id }],
          },
          is_draft: false,
          removed_at: null,
        },
      ]);
    });

    it("trigger events even if forcing a refresh and results are the same", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({
        totalCount: 2,
        items: [{ id: "Q7747" }, { id: "rupep-company-718" }],
      });

      await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!) {
            saveProfileFieldValueDraft(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            )
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
        },
      );

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name, force: true) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Putin",
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.backgroundCheckEntitySearch).toEqual({
        totalCount: 2,
        items: [{ id: "Q7747" }, { id: "rupep-company-718" }],
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledTimes(2);

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs.map(pick(["content", "is_draft", "removed_at"]))).toIncludeSameMembers([
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
          is_draft: true,
          removed_at: expect.any(Date),
        },
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
          is_draft: false,
          removed_at: expect.any(Date),
        },
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
          is_draft: false,
          removed_at: null,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where({ profile_id: profile.id })
        .select("*");

      expect(profileEvents).toHaveLength(4);
      expect(profileEvents.map(pick(["type"]))).toIncludeSameMembers([
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
      ]);
    });

    it("trigger events if forcing a refresh and results are different", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
              items {
                id
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({
        totalCount: 2,
        items: [{ id: "Q7747" }, { id: "rupep-company-718" }],
      });

      const { errors: updateFalsePositivesErrors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityIds: [String!]!) {
            updateBackgroundCheckSearchFalsePositives(
              token: $token
              entityIds: $entityIds
              isFalsePositive: true
            )
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityIds: ["Q7747", "rupep-company-718"],
        },
      );

      expect(updateFalsePositivesErrors).toBeUndefined();

      backgroundCheckServiceSpy.mockResolvedValueOnce({
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
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name, force: true) {
              totalCount
              items {
                id
                isFalsePositive
              }
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          name: "Putin",
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.backgroundCheckEntitySearch).toEqual({
        totalCount: 1,
        items: [{ id: "Q7747", isFalsePositive: true }],
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledTimes(2);

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs.map(pick(["content", "is_draft", "removed_at"]))).toIncludeSameMembers([
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
          is_draft: true,
          removed_at: expect.any(Date),
        },
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
            falsePositives: [
              { id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id },
              { id: "rupep-company-718", addedAt: expect.any(String), addedByUserId: user.id },
            ],
          },
          is_draft: false,
          removed_at: expect.any(Date),
        },
        {
          content: {
            query: {
              name: "Putin",
              date: null,
              type: null,
              country: null,
              birthCountry: null,
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
            falsePositives: [{ id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id }],
          },
          is_draft: false,
          removed_at: null,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where({ profile_id: profile.id })
        .select("*");

      expect(profileEvents).toHaveLength(4);
      expect(profileEvents.map(pick(["type"]))).toIncludeSameMembers([
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
      ]);
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
              hasStoredEntity
              isStoredEntity
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
        hasStoredEntity: false,
        isStoredEntity: false,
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id);
    });

    it("returns stored entity when requesting same entity", async () => {
      await mocks.createProfileFieldValues(profile.id, [
        {
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
          pending_review: true,
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $entityId: String!) {
            backgroundCheckEntityDetails(token: $token, entityId: $entityId) {
              id
              type
              name
              hasPendingReview
              hasStoredEntity
              isStoredEntity
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
        hasPendingReview: true,
        hasStoredEntity: true,
        isStoredEntity: true,
      });

      expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
    });

    it("makes a new search in openSanctions if entity is different", async () => {
      await mocks.createProfileFieldValues(profile.id, [
        {
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
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $entityId: String!) {
            backgroundCheckEntityDetails(token: $token, entityId: $entityId) {
              id
              type
              name
              hasStoredEntity
              isStoredEntity
            }
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "rupep-company-718",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntityDetails).toEqual({
        id: "rupep-company-718",
        type: "Company",
        name: "Putin Consulting LLC",
        hasStoredEntity: true,
        isStoredEntity: false,
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith(
        "rupep-company-718",
        user.id,
      );
    });

    it("trigger events even if forcing a refresh and entity details are the same", async () => {
      await mocks.createProfileFieldValues(profile.id, [
        {
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
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $entityId: String!) {
            backgroundCheckEntityDetails(token: $token, entityId: $entityId, force: true) {
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

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id, {
        skipCache: true,
      });

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where({ profile_id: profile.id })
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["type"]))).toIncludeSameMembers([
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
      ]);
    });

    it("trigger events if forcing a refresh and entity details are different", async () => {
      await mocks.createProfileFieldValues(profile.id, [
        {
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
                  name: "Vladimir V PUTIN",
                  properties: {},
                },
              ],
              createdAt: new Date().toISOString(),
            },
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Vladimir V PUTIN",
              properties: {},
              createdAt: new Date().toISOString(),
            },
          },
          type: "BACKGROUND_CHECK",
          created_by_user_id: user.id,
        },
      ]);

      const { data, errors } = await testClient.execute(
        gql`
          query ($token: String!, $entityId: String!) {
            backgroundCheckEntityDetails(token: $token, entityId: $entityId, force: true) {
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

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id, {
        skipCache: true,
      });

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(pfvs.map(pick(["content", "is_draft", "removed_at"]))).toIncludeSameMembers([
        {
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
                  name: "Vladimir V PUTIN",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Vladimir V PUTIN",
              properties: {},
              createdAt: expect.any(String),
            },
          },
          is_draft: false,
          removed_at: expect.any(Date),
        },
        {
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
                  name: "Vladimir V PUTIN",
                  properties: {},
                },
              ],
              createdAt: expect.any(String),
            },
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Vladimir Vladimirovich PUTIN",
              properties: {},
              createdAt: expect.any(String),
            },
          },
          is_draft: false,
          removed_at: null,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where({ profile_id: profile.id })
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["type"]))).toIncludeSameMembers([
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" },
      ]);
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

      [profileFieldValue] = await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeField.id,
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
              createdAt: new Date().toISOString(),
            },
            entity: null,
          },
          type: "BACKGROUND_CHECK",
          created_by_user_id: user.id,
          is_draft: true,
        },
      ]);
    });

    afterEach(async () => {
      backgroundCheckServiceSpy.mockClear();
    });

    it("sends error if profile field value is not found", async () => {
      await mocks.knex.from("profile_field_value").where("id", profileFieldValue.id).delete();

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
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
      const [textPtf] = await mocks.createRandomProfileTypeFields(
        organization.id,
        profileType.id,
        1,
        () => ({ type: "TEXT" }),
      );
      await mocks.knex.from("profile_field_value").where("id", profileFieldValue.id).update({
        type: "TEXT",
        profile_type_field_id: textPtf.id,
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
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
          mutation ($token: String!, $entityId: String) {
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
      expect(
        pfvs.map(
          pick([
            "profile_id",
            "profile_type_field_id",
            "type",
            "content",
            "expiry_date",
            "removed_at",
            "is_draft",
          ]),
        ),
      ).toIncludeSameMembers([
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
          is_draft: true,
        },
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
          is_draft: false,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
            org_integration_id: null,
            profile_type_field_ids: [profileTypeField.id],
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs.find((v) => !v.is_draft)!.id,
            previous_profile_field_value_id: null,
            alias: null,
            external_source_integration_id: null,
          },
        },
      ]);

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id);
    });

    it("updating twice with same entityId should not create 2 values", async () => {
      await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      const { data, errors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
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
      expect(
        pfvs.map(
          pick([
            "profile_id",
            "profile_type_field_id",
            "type",
            "content",
            "expiry_date",
            "removed_at",
            "is_draft",
          ]),
        ),
      ).toIncludeSameMembers([
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
          is_draft: true,
        },
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
          is_draft: false,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
            org_integration_id: null,
            profile_type_field_ids: [profileTypeField.id],
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs.find((v) => !v.is_draft)!.id,
            previous_profile_field_value_id: null,
            alias: null,
            external_source_integration_id: null,
          },
        },
      ]);

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id);
    });

    it("conserves stored entity and creates a draft when updating with null", async () => {
      await mocks.knex
        .from("profile_field_value")
        .where("id", profileFieldValue.id)
        .update({
          is_draft: false,
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
            "is_draft",
          ]),
        ),
      ).toIncludeSameMembers([
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
          deleted_at: null,
          is_draft: false,
        },
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
          removed_at: null,
          deleted_at: null,
          is_draft: true,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(0);

      expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
    });

    it("removing the entity should create a draft with a search and keep the value", async () => {
      await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

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

      expect(pfvs).toHaveLength(3);
      expect(
        pfvs.map(
          pick([
            "profile_id",
            "profile_type_field_id",
            "type",
            "content",
            "expiry_date",
            "removed_at",
            "is_draft",
          ]),
        ),
      ).toIncludeSameMembers([
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
          is_draft: true,
        },
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
          is_draft: false,
        },
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
          removed_at: null,
          is_draft: true,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(2);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
            org_integration_id: null,
            profile_type_field_ids: [profileTypeField.id],
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: pfvs.find((v) => !v.is_draft)!.id,
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("replacing the stored entity should not generate a draft", async () => {
      await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "rupep-company-718",
        },
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
        })
        .select("*");

      expect(pfvs).toHaveLength(3);
      expect(
        pfvs.map(
          pick([
            "profile_id",
            "profile_type_field_id",
            "type",
            "content",
            "expiry_date",
            "removed_at",
            "is_draft",
          ]),
        ),
      ).toIncludeSameMembers([
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
          is_draft: true,
        },
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
          is_draft: false,
        },
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
            entity: {
              id: "rupep-company-718",
              name: "Putin Consulting LLC",
              type: "Company",
              properties: {},
              createdAt: expect.any(String),
            },
          },
          expiry_date: null,
          removed_at: null,
          is_draft: false,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(4);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
            org_integration_id: null,
            profile_type_field_ids: [profileTypeField.id],
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: firstBy(
              pfvs.filter((v) => !v.is_draft),
              [(v) => v.id, "desc"],
            )!.id,
            previous_profile_field_value_id: firstBy(
              pfvs.filter((v) => !v.is_draft),
              [(v) => v.id, "asc"],
            )!.id,
            alias: null,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
            org_integration_id: null,
            profile_type_field_ids: [profileTypeField.id],
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: firstBy(
              pfvs.filter((v) => !v.is_draft),
              [(v) => v.id, "asc"],
            )!.id,
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });

    it("setting entity, removing it and setting it again should create 2 values", async () => {
      await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );
      await testClient.execute(
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
      await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityId: "Q7747",
        },
      );

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      // expect(pfvs).toHaveLength(4);
      expect(
        pfvs.map(pick(["profile_type_field_id", "is_draft", "content", "removed_at"])),
      ).toIncludeSameMembers([
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
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
          removed_at: expect.any(Date),
        },
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: false,
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
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Vladimir Vladimirovich PUTIN",
              properties: {},
              createdAt: expect.any(String),
            },
          },
          removed_at: expect.any(Date),
        },
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
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
          removed_at: expect.any(Date),
        },
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: false,
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
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Vladimir Vladimirovich PUTIN",
              properties: {},
              createdAt: expect.any(String),
            },
          },
          removed_at: null,
        },
      ]);

      const profileEvents = await mocks.knex
        .from("profile_event")
        .where("profile_id", profile.id)
        .orderBy([
          { column: "created_at", order: "desc" },
          { column: "id", order: "desc" },
        ])
        .select("*");

      expect(profileEvents).toHaveLength(4);
      expect(profileEvents.map(pick(["org_id", "profile_id", "type", "data"]))).toEqual([
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
            org_integration_id: null,
            profile_type_field_ids: [profileTypeField.id],
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: firstBy(
              pfvs.filter((v) => !v.is_draft),
              [(v) => v.id, "desc"],
            )!.id,
            previous_profile_field_value_id: firstBy(
              pfvs.filter((v) => !v.is_draft),
              [(v) => v.id, "asc"],
            )!.id,
            alias: null,
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_UPDATED",
          data: {
            user_id: user.id,
            org_integration_id: null,
            profile_type_field_ids: [profileTypeField.id],
          },
        },
        {
          org_id: organization.id,
          profile_id: profile.id,
          type: "PROFILE_FIELD_VALUE_UPDATED",
          data: {
            user_id: user.id,
            external_source_integration_id: null,
            profile_type_field_id: profileTypeField.id,
            current_profile_field_value_id: firstBy(
              pfvs.filter((v) => !v.is_draft),
              [(v) => v.id, "asc"],
            )!.id,
            previous_profile_field_value_id: null,
            alias: null,
          },
        },
      ]);
    });
  });

  describe("updateBackgroundCheckSearchFalsePositives", () => {
    let profileType: ProfileType;
    let profileTypeField: ProfileTypeField;
    let profile: Profile;

    beforeEach(async () => {
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

      await mocks.createProfileFieldValues(profile.id, [
        {
          profile_type_field_id: profileTypeField.id,
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
              createdAt: new Date().toISOString(),
            },
            entity: null,
          },
          type: "BACKGROUND_CHECK",
          created_by_user_id: user.id,
          is_draft: true,
        },
      ]);
    });

    it("sets a result item as false positive, maintaining the draft", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityIds: [String!]!, $isFalsePositive: Boolean!) {
            updateBackgroundCheckSearchFalsePositives(
              token: $token
              entityIds: $entityIds
              isFalsePositive: $isFalsePositive
            )
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityIds: ["Q7747"],
          isFalsePositive: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckSearchFalsePositives).toEqual("SUCCESS");

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(1);
      expect(
        pfvs.map(pick(["profile_type_field_id", "is_draft", "content", "removed_at"])),
      ).toEqual([
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
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
            falsePositives: [
              {
                id: "Q7747",
                addedAt: expect.any(String),
                addedByUserId: user.id,
              },
            ],
          },
          removed_at: null,
        },
      ]);
    });

    it("setting every item as false positive over a draft should remove the draft and store the value", async () => {
      const { data, errors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityIds: [String!]!, $isFalsePositive: Boolean!) {
            updateBackgroundCheckSearchFalsePositives(
              token: $token
              entityIds: $entityIds
              isFalsePositive: $isFalsePositive
            )
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityIds: ["Q7747", "rupep-company-718"],
          isFalsePositive: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckSearchFalsePositives).toEqual("SUCCESS");

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(
        pfvs.map(pick(["profile_type_field_id", "is_draft", "content", "removed_at"])),
      ).toIncludeSameMembers([
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
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
          removed_at: expect.any(Date),
        },
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: false,
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
            falsePositives: [
              {
                id: "Q7747",
                addedAt: expect.any(String),
                addedByUserId: user.id,
              },
              {
                id: "rupep-company-718",
                addedAt: expect.any(String),
                addedByUserId: user.id,
              },
            ],
          },
          removed_at: null,
        },
      ]);
    });

    it("removing a false positive should create a draft", async () => {
      await testClient.execute(
        gql`
          mutation ($token: String!, $entityIds: [String!]!, $isFalsePositive: Boolean!) {
            updateBackgroundCheckSearchFalsePositives(
              token: $token
              entityIds: $entityIds
              isFalsePositive: $isFalsePositive
            )
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityIds: ["Q7747", "rupep-company-718"],
          isFalsePositive: true,
        },
      );

      const { data, errors } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityIds: [String!]!, $isFalsePositive: Boolean!) {
            updateBackgroundCheckSearchFalsePositives(
              token: $token
              entityIds: $entityIds
              isFalsePositive: $isFalsePositive
            )
          }
        `,
        {
          token: buildToken({ profileId: profile.id, profileTypeFieldId: profileTypeField.id }),
          entityIds: ["Q7747"],
          isFalsePositive: false,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckSearchFalsePositives).toEqual("SUCCESS");

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(3);
      expect(
        pfvs.map(pick(["profile_type_field_id", "is_draft", "content", "removed_at"])),
      ).toIncludeSameMembers([
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
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
          removed_at: expect.any(Date),
        },
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: false,
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
            falsePositives: [
              {
                id: "Q7747",
                addedAt: expect.any(String),
                addedByUserId: user.id,
              },
              {
                id: "rupep-company-718",
                addedAt: expect.any(String),
                addedByUserId: user.id,
              },
            ],
          },
          removed_at: null,
        },
        {
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
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
            falsePositives: [
              {
                id: "rupep-company-718",
                addedAt: expect.any(String),
                addedByUserId: user.id,
              },
            ],
          },
          removed_at: null,
        },
      ]);
    });
  });

  describe("saveProfileFieldValueDraft", () => {
    let profileType: ProfileType;
    let profileTypeField: ProfileTypeField;
    let profile: Profile;

    beforeEach(async () => {
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

    it("saves an empty search of a background check", async () => {
      // first search to generate draft
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

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileId: GID!, $profileTypeFieldId: GID!) {
            saveProfileFieldValueDraft(
              profileId: $profileId
              profileTypeFieldId: $profileTypeFieldId
            )
          }
        `,
        {
          profileId: toGlobalId("Profile", profile.id),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.saveProfileFieldValueDraft).toEqual("SUCCESS");

      const pfvs = await mocks.knex
        .from("profile_field_value")
        .where("profile_id", profile.id)
        .select("*");

      expect(pfvs).toHaveLength(2);
      expect(
        pfvs.map(pick(["is_draft", "removed_at", "deleted_at", "anonymized_at"])),
      ).toIncludeSameMembers([
        {
          is_draft: true,
          removed_at: expect.any(Date),
          deleted_at: null,
          anonymized_at: null,
        },
        {
          is_draft: false,
          removed_at: null,
          deleted_at: null,
          anonymized_at: null,
        },
      ]);
    });
  });
});
