import { gql } from "graphql-request";
import { Knex } from "knex";
import { pick } from "remeda";
import { Organization, Profile, ProfileType, ProfileTypeField, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("Adverse Media - Profiles", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let organization: Organization;
  let user: User;

  let profileType: ProfileType;
  let profileTypeField: ProfileTypeField;

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
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([
      { name: "PROFILES", default_value: true },
      { name: "ADVERSE_MEDIA_SEARCH", default_value: true },
    ]);

    [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
    [profileTypeField] = await mocks.createRandomProfileTypeFields(
      organization.id,
      profileType.id,
      1,
      () => ({ type: "ADVERSE_MEDIA_SEARCH" }),
    );
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("adverseMediaArticleSearch", () => {
    let profile: Profile;

    beforeEach(async () => {
      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);
    });

    afterEach(async () => {
      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "WRITE",
      });
    });

    it("returns null if there is no profile value and searchTerm is not provided", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!) {
            adverseMediaArticleSearch(token: $token) {
              __typename
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleSearch).toBeNull();
    });

    it("returns stored profile value if no search term is provided and there is no draft value", async () => {
      await mocks.knex.from("profile_field_value").insert({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        content: {
          search: [{ wikiDataId: "Q7747", label: "Vladimir Putin" }],
          articles: {
            totalCount: 2,
            items: [
              {
                id: "1",
                header: "Vladimir Putin does something",
                timestamp: 1600000000,
                source: "Google News",
              },
              {
                id: "2",
                header: "Vladimir Putin does something else",
                timestamp: 1600000001,
                source: "Google News",
              },
            ],
            createdAt: new Date(),
          },
          relevant_articles: [{ id: "1", added_at: new Date(), added_by_user_id: user.id }],
          irrelevant_articles: [],
          dismissed_articles: [],
        },
        type: "ADVERSE_MEDIA_SEARCH",
        created_by_user_id: user.id,
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!) {
            adverseMediaArticleSearch(token: $token) {
              isDraft
              articles {
                totalCount
                items {
                  id
                  header
                  source
                  timestamp
                  classification
                  classifiedAt
                }
                createdAt
              }
              search {
                entityId
                term
                wikiDataId
                label
              }
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleSearch).toEqual({
        isDraft: false,
        articles: {
          totalCount: 2,
          items: [
            {
              id: "1",
              header: "Vladimir Putin does something",
              source: "Google News",
              timestamp: 1600000000,
              classification: "RELEVANT",
              classifiedAt: expect.any(Date),
            },
            {
              id: "2",
              header: "Vladimir Putin does something else",
              source: "Google News",
              timestamp: 1600000001,
              classification: null,
              classifiedAt: null,
            },
          ],
          createdAt: expect.any(Date),
        },
        search: [
          {
            term: null,
            entityId: null,
            wikiDataId: "Q7747",
            label: "Vladimir Putin",
          },
        ],
      });
    });

    it("returns stored draft value if no search term is provided and there is a draft value", async () => {
      await mocks.knex.from("profile_field_value").insert([
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          content: {
            search: [{ wikiDataId: "Q7747", label: "Vladimir Putin" }],
            articles: {
              totalCount: 2,
              items: [
                {
                  id: "1",
                  header: "Vladimir Putin does something",
                  timestamp: 1600000000,
                  source: "Google News",
                },
                {
                  id: "2",
                  header: "Vladimir Putin does something else",
                  timestamp: 1600000001,
                  source: "Google News",
                },
              ],
              createdAt: new Date(),
            },
            relevant_articles: [{ id: "1", added_at: new Date(), added_by_user_id: user.id }],
            irrelevant_articles: [],
            dismissed_articles: [],
          },
          type: "ADVERSE_MEDIA_SEARCH",
          created_by_user_id: user.id,
        },
        {
          profile_id: profile.id,
          profile_type_field_id: profileTypeField.id,
          content: {
            search: [{ wikiDataId: "Q7747", label: "Vladimir Putin" }, { term: "Donald Trump" }],
            articles: {
              totalCount: 2,
              items: [
                {
                  id: "1",
                  header: "Vladimir Putin does something",
                  timestamp: 1600000000,
                  source: "Google News",
                },
                {
                  id: "3",
                  header: "Donald Trump does something",
                  timestamp: 2000000000,
                  source: "Google News",
                },
              ],
              createdAt: new Date(),
            },
            relevant_articles: [{ id: "1", added_at: new Date(), added_by_user_id: user.id }],
            irrelevant_articles: [{ id: "3", added_at: new Date(), added_by_user_id: user.id }],
            dismissed_articles: [],
          },
          type: "ADVERSE_MEDIA_SEARCH",
          created_by_user_id: user.id,
          is_draft: true,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!) {
            adverseMediaArticleSearch(token: $token) {
              isDraft
              articles {
                totalCount
                items {
                  id
                  header
                  source
                  timestamp
                  classification
                  classifiedAt
                }
                createdAt
              }
              search {
                entityId
                term
                wikiDataId
                label
              }
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleSearch).toEqual({
        isDraft: true,
        articles: {
          totalCount: 2,
          items: [
            {
              id: "1",
              header: "Vladimir Putin does something",
              source: "Google News",
              timestamp: 1600000000,
              classification: "RELEVANT",
              classifiedAt: expect.any(Date),
            },
            {
              id: "3",
              header: "Donald Trump does something",
              source: "Google News",
              timestamp: 2000000000,
              classification: "IRRELEVANT",
              classifiedAt: expect.any(Date),
            },
          ],
          createdAt: expect.any(Date),
        },
        search: [
          {
            term: null,
            entityId: null,
            wikiDataId: "Q7747",
            label: "Vladimir Putin",
          },
          {
            term: "Donald Trump",
            entityId: null,
            wikiDataId: null,
            label: null,
          },
        ],
      });
    });

    it("creates a new profile value on an adverse_media property if it was never replied", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              isDraft
              articles {
                items {
                  id
                }
                totalCount
                createdAt
              }
              search {
                term
                entityId
                wikiDataId
                label
              }
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          search: [{ term: "Donald Trump" }],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleSearch).toEqual({
        isDraft: false,
        articles: {
          totalCount: 5,
          items: [
            { id: "FINANCIAL_SCANDAL" },
            { id: "ELON_MUSK" },
            { id: "VLADIMIR_PUTIN" },
            { id: "JANE_SMITH" },
            { id: "JOHN_DOE" },
          ],
          createdAt: expect.any(Date),
        },
        search: [
          {
            term: "Donald Trump",
            entityId: null,
            wikiDataId: null,
            label: null,
          },
        ],
      });
    });

    it("creates a draft value if the property is already replied and a new search is made", async () => {
      await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              isDraft
              articles {
                items {
                  id
                }
                totalCount
                createdAt
              }
              search {
                term
                entityId
                wikiDataId
                label
              }
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          search: [{ term: "Donald Trump" }],
        },
      );

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              isDraft
              articles {
                items {
                  id
                }
                totalCount
                createdAt
              }
              search {
                term
                entityId
                wikiDataId
                label
              }
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          search: [{ entityId: "VLADIMIR_PUTIN", label: "Vladimir Putin" }],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleSearch).toEqual({
        isDraft: true,
        articles: {
          totalCount: 1,
          items: [{ id: "VLADIMIR_PUTIN" }],
          createdAt: expect.any(Date),
        },
        search: [
          {
            entityId: "VLADIMIR_PUTIN",
            term: null,
            wikiDataId: null,
            label: "Vladimir Putin",
          },
        ],
      });

      const dbPfvs = await mocks.knex.from("profile_field_value").where({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "ADVERSE_MEDIA_SEARCH",
      });

      expect(
        dbPfvs.map(pick(["is_draft", "removed_at", "removed_by_user_id", "deleted_at", "content"])),
      ).toIncludeSameMembers([
        {
          is_draft: false,
          removed_at: null,
          removed_by_user_id: null,
          deleted_at: null,
          content: {
            search: [{ term: "Donald Trump" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [],
            irrelevant_articles: [],
            dismissed_articles: [],
          },
        },
        {
          is_draft: true,
          removed_at: null,
          removed_by_user_id: null,
          deleted_at: null,
          content: {
            search: [{ entityId: "VLADIMIR_PUTIN", label: "Vladimir Putin" }],
            articles: {
              totalCount: 1,
              items: expect.toBeArrayOfSize(1),
              createdAt: expect.any(String),
            },
            relevant_articles: [],
            irrelevant_articles: [],
            dismissed_articles: [],
          },
        },
      ]);
    });

    it("sends error if user tries to run a new search with READ permission", async () => {
      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "READ",
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              __typename
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          search: [{ term: "Donald Trump" }],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data?.adverseMediaArticleSearch).toBeNull();
    });

    it("sends error if user does not have permission on the property", async () => {
      await mocks.knex.from("profile_field_value").insert({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        content: {
          search: [{ wikiDataId: "Q7747", label: "Vladimir Putin" }],
          articles: {
            totalCount: 2,
            items: [
              {
                id: "1",
                header: "Vladimir Putin does something",
                timestamp: 1600000000,
                source: "Google News",
              },
              {
                id: "2",
                header: "Vladimir Putin does something else",
                timestamp: 1600000001,
                source: "Google News",
              },
            ],
            createdAt: new Date(),
          },
          relevant_articles: [{ id: "1", added_at: new Date(), added_by_user_id: user.id }],
          irrelevant_articles: [],
          dismissed_articles: [],
        },
        type: "ADVERSE_MEDIA_SEARCH",
        created_by_user_id: user.id,
      });

      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "HIDDEN",
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!) {
            adverseMediaArticleSearch(token: $token) {
              __typename
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data?.adverseMediaArticleSearch).toBeNull();
    });
  });

  describe("classifyAdverseMediaArticle", () => {
    let profile: Profile;

    beforeEach(async () => {
      [profile] = await mocks.createRandomProfiles(organization.id, profileType.id, 1);

      await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              articles {
                totalCount
                items {
                  id
                }
              }
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          search: [{ term: "free text search" }],
        },
      );
    });

    afterEach(async () => {
      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "WRITE",
      });
    });

    it("classifies articles and sets classification data in draft value", async () => {
      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "VLADIMIR_PUTIN",
          classification: "RELEVANT",
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1?.classifyAdverseMediaArticle).toEqual({
        id: "VLADIMIR_PUTIN",
        classification: "RELEVANT",
        classifiedAt: expect.any(Date),
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "JOHN_DOE",
          classification: "IRRELEVANT",
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.classifyAdverseMediaArticle).toEqual({
        id: "JOHN_DOE",
        classification: "IRRELEVANT",
        classifiedAt: expect.any(Date),
      });

      const dbPfvs = await mocks.knex.from("profile_field_value").where({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "ADVERSE_MEDIA_SEARCH",
      });

      expect(
        dbPfvs.map(pick(["is_draft", "removed_at", "removed_by_user_id", "deleted_at", "content"])),
      ).toIncludeSameMembers([
        {
          is_draft: false,
          removed_at: null,
          removed_by_user_id: null,
          deleted_at: null,
          content: {
            search: [{ term: "free text search" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [],
            irrelevant_articles: [],
            dismissed_articles: [],
          },
        },
        {
          is_draft: true,
          removed_at: null,
          removed_by_user_id: null,
          deleted_at: null,
          content: {
            search: [{ term: "free text search" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [
              { id: "VLADIMIR_PUTIN", added_at: expect.any(String), added_by_user_id: user.id },
            ],
            irrelevant_articles: [
              { id: "JOHN_DOE", added_at: expect.any(String), added_by_user_id: user.id },
            ],
            dismissed_articles: [],
          },
        },
      ]);
    });

    it("sends error if article is not included in value content", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "UNKNOWN_ARTICLE",
          classification: "RELEVANT",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("removes classification from article", async () => {
      await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "VLADIMIR_PUTIN",
          classification: "RELEVANT",
        },
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "VLADIMIR_PUTIN",
          classification: null,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.classifyAdverseMediaArticle).toEqual({
        id: "VLADIMIR_PUTIN",
        classification: null,
        classifiedAt: null,
      });

      const dbPfvs = await mocks.knex.from("profile_field_value").where({
        profile_id: profile.id,
        profile_type_field_id: profileTypeField.id,
        type: "ADVERSE_MEDIA_SEARCH",
      });

      expect(
        dbPfvs.map(pick(["is_draft", "removed_at", "removed_by_user_id", "deleted_at", "content"])),
      ).toIncludeSameMembers([
        {
          is_draft: false,
          removed_at: null,
          removed_by_user_id: null,
          deleted_at: null,
          content: {
            search: [{ term: "free text search" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [],
            irrelevant_articles: [],
            dismissed_articles: [],
          },
        },
        {
          is_draft: true,
          removed_at: null,
          removed_by_user_id: null,
          deleted_at: null,
          content: {
            search: [{ term: "free text search" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [],
            irrelevant_articles: [],
            dismissed_articles: [],
          },
        },
      ]);
    });

    it("sends error if user does not have WRITE permission on the property", async () => {
      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "READ",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profile.id,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "VLADIMIR_PUTIN",
          classification: "RELEVANT",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("saveProfileFieldValueDraft", () => {
    let profileId: number;

    beforeEach(async () => {
      const { data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!) {
            createProfile(profileTypeId: $profileTypeId) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
        },
      );

      profileId = fromGlobalId(data.createProfile.id, "Profile").id;

      await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              articles {
                totalCount
                items {
                  id
                }
              }
            }
          }
        `,
        {
          token: buildToken({
            profileId: profileId,
            profileTypeFieldId: profileTypeField.id,
          }),
          search: [{ term: "free text search" }],
        },
      );

      await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profileId,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "VLADIMIR_PUTIN",
          classification: "RELEVANT",
        },
      );

      await testClient.execute(
        gql`
          mutation (
            $articleId: String!
            $token: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              id: $articleId
              token: $token
              classification: $classification
            ) {
              id
              classification
              classifiedAt
            }
          }
        `,
        {
          token: buildToken({
            profileId: profileId,
            profileTypeFieldId: profileTypeField.id,
          }),
          articleId: "JOHN_DOE",
          classification: "IRRELEVANT",
        },
      );
    });

    afterEach(async () => {
      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "WRITE",
      });
    });

    it("saves changes made in draft value to profile value", async () => {
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
          profileId: toGlobalId("Profile", profileId),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.saveProfileFieldValueDraft).toEqual("SUCCESS");

      const dbPfvs = await mocks.knex.from("profile_field_value").where({
        profile_id: profileId,
        profile_type_field_id: profileTypeField.id,
        type: "ADVERSE_MEDIA_SEARCH",
      });

      expect(
        dbPfvs.map(pick(["is_draft", "removed_at", "removed_by_user_id", "deleted_at", "content"])),
      ).toIncludeSameMembers([
        // original search. no draft, removed
        {
          is_draft: false,
          removed_at: expect.any(Date),
          removed_by_user_id: user.id,
          deleted_at: null,
          content: {
            search: [{ term: "free text search" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [],
            irrelevant_articles: [],
            dismissed_articles: [],
          },
        },
        // new search. no draft, not removed
        {
          is_draft: false,
          removed_at: null,
          removed_by_user_id: null,
          deleted_at: null,
          content: {
            search: [{ term: "free text search" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [
              { id: "VLADIMIR_PUTIN", added_at: expect.any(String), added_by_user_id: user.id },
            ],
            irrelevant_articles: [
              { id: "JOHN_DOE", added_at: expect.any(String), added_by_user_id: user.id },
            ],
            dismissed_articles: [],
          },
        },
        {
          // draft. removed
          is_draft: true,
          removed_at: expect.any(Date),
          removed_by_user_id: user.id,
          deleted_at: null,
          content: {
            search: [{ term: "free text search" }],
            articles: {
              totalCount: 5,
              items: expect.toBeArrayOfSize(5),
              createdAt: expect.any(String),
            },
            relevant_articles: [
              { id: "VLADIMIR_PUTIN", added_at: expect.any(String), added_by_user_id: user.id },
            ],
            irrelevant_articles: [
              { id: "JOHN_DOE", added_at: expect.any(String), added_by_user_id: user.id },
            ],
            dismissed_articles: [],
          },
        },
      ]);

      const dbEvents = await mocks.knex
        .from("profile_event")
        .where({
          profile_id: profileId,
        })
        .orderBy("id", "asc")
        .select("type");

      expect(dbEvents).toEqual([
        { type: "PROFILE_CREATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" }, // created on first search
        { type: "PROFILE_UPDATED" },
        { type: "PROFILE_FIELD_VALUE_UPDATED" }, // updated after saving changes
        { type: "PROFILE_UPDATED" },
      ]);
    });

    it("sends error if there is no draft value", async () => {
      await mocks.knex
        .from("profile_field_value")
        .where({
          profile_id: profileId,
          profile_type_field_id: profileTypeField.id,
          is_draft: true,
        })
        .delete();

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
          profileId: toGlobalId("Profile", profileId),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have WRITE permission on the property", async () => {
      await mocks.knex.from("profile_type_field").where("id", profileTypeField.id).update({
        permission: "READ",
      });

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
          profileId: toGlobalId("Profile", profileId),
          profileTypeFieldId: toGlobalId("ProfileTypeField", profileTypeField.id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
