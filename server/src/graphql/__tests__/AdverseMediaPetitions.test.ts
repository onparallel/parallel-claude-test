import { faker } from "@faker-js/faker";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { Organization, Petition, PetitionField, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  ADVERSE_MEDIA_SEARCH_SERVICE,
  IAdverseMediaSearchService,
} from "../../services/AdverseMediaSearchService";
import { toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("Adverse Media - Petitions", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let user: User;
  let organization: Organization;

  function buildToken(params: { petitionId: number; fieldId: number; parentReplyId?: number }) {
    return Buffer.from(
      JSON.stringify({
        petitionId: toGlobalId("Petition", params.petitionId),
        fieldId: toGlobalId("PetitionField", params.fieldId),
        ...(params.parentReplyId
          ? { parentReplyId: toGlobalId("PetitionFieldReply", params.parentReplyId) }
          : {}),
      }),
    ).toString("base64");
  }

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([{ name: "ADVERSE_MEDIA_SEARCH", default_value: true }]);

    await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 100);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("adverseMediaArticleSearch", () => {
    let petition: Petition;
    let field: PetitionField;
    let searchArticlesSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        is_template: false,
      }));

      [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "ADVERSE_MEDIA_SEARCH",
      }));

      searchArticlesSpy = vi.spyOn(
        testClient.container.get<IAdverseMediaSearchService>(ADVERSE_MEDIA_SEARCH_SERVICE),
        "searchArticles",
      );
    });

    afterEach(() => {
      searchArticlesSpy.mockClear();
    });

    it("returns null if there is no reply and searchTerm is not provided", async () => {
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          search: null,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleSearch).toBeNull();
    });

    it("creates a new reply on an adverse_media field", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              articles {
                totalCount
                items {
                  id
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          search: [
            { entityId: "VLADIMIR_PUTIN", label: "Vladimir Putin" },
            { entityId: "FINANCIAL_SCANDAL" },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleSearch).toEqual({
        articles: {
          totalCount: 2,
          items: [
            {
              id: "FINANCIAL_SCANDAL",
            },
            {
              id: "VLADIMIR_PUTIN",
            },
          ],
          createdAt: expect.any(Date),
        },
        search: [
          { entityId: "VLADIMIR_PUTIN", label: "Vladimir Putin", term: null, wikiDataId: null },
          { entityId: "FINANCIAL_SCANDAL", label: null, term: null, wikiDataId: null },
        ],
      });

      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", field.id)
        .whereNull("deleted_at");

      expect(dbReplies).toHaveLength(1);
      expect(dbReplies[0].content).toEqual({
        search: [
          { entityId: "VLADIMIR_PUTIN", label: "Vladimir Putin" },
          { entityId: "FINANCIAL_SCANDAL" },
        ],
        articles: {
          totalCount: 2,
          items: [
            {
              id: "FINANCIAL_SCANDAL",
              header: "Major bank implicated in money laundering scheme",
              source: "Finance News Network",
              timestamp: 5,
            },
            {
              id: "VLADIMIR_PUTIN",
              header: "Vladimir Putin makes controversial statement",
              source: "International News",
              timestamp: 3,
            },
          ],
          createdAt: expect.any(String),
        },
        relevant_articles: [],
        irrelevant_articles: [],
        dismissed_articles: [],
      });
    });

    it("does not remove classified articles if a new search is made", async () => {
      const { errors: search1Errors, data: search1Data } = await testClient.execute(
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          search: [{ term: faker.word.words(3) }],
        },
      );

      expect(searchArticlesSpy).toHaveBeenNthCalledWith(1, [{ term: expect.any(String) }], {
        excludeArticles: [],
      });

      expect(search1Errors).toBeUndefined();
      expect(search1Data?.adverseMediaArticleSearch).toEqual({
        articles: {
          totalCount: 5,
          items: [
            {
              id: "FINANCIAL_SCANDAL",
            },
            {
              id: "ELON_MUSK",
            },
            {
              id: "VLADIMIR_PUTIN",
            },
            {
              id: "JANE_SMITH",
            },
            {
              id: "JOHN_DOE",
            },
          ],
        },
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "FINANCIAL_SCANDAL",
          classification: "IRRELEVANT",
        },
      );
      expect(errors2).toBeUndefined();
      expect(data2?.classifyAdverseMediaArticle).toEqual({
        id: "FINANCIAL_SCANDAL",
        classification: "IRRELEVANT",
        classifiedAt: expect.any(Date),
      });

      const { errors: errors3, data: data3 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "JOHN_DOE",
          classification: "DISMISSED",
        },
      );
      expect(errors3).toBeUndefined();
      expect(data3?.classifyAdverseMediaArticle).toEqual({
        id: "JOHN_DOE",
        classification: "DISMISSED",
        classifiedAt: expect.any(Date),
      });

      const dbReplies1 = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", field.id)
        .whereNull("deleted_at");

      expect(dbReplies1).toHaveLength(1);
      expect(dbReplies1[0].content).toEqual({
        search: expect.toBeArrayOfSize(1),
        articles: {
          totalCount: 5,
          items: [
            {
              id: "FINANCIAL_SCANDAL",
              header: "Major bank implicated in money laundering scheme",
              source: "Finance News Network",
              timestamp: 5,
            },
            {
              id: "ELON_MUSK",
              header: "Elon Musk announces new AI venture",
              source: "Tech Journal",
              timestamp: 4,
            },
            {
              id: "VLADIMIR_PUTIN",
              header: "Vladimir Putin makes controversial statement",
              source: "International News",
              timestamp: 3,
            },
            {
              id: "JANE_SMITH",
              header: "Jane Smith wins prestigious award",
              source: "News Daily",
              timestamp: 2,
            },
            {
              id: "JOHN_DOE",
              header: "John Doe is a good person",
              source: "Google",
              timestamp: 1,
            },
          ],
          createdAt: expect.any(String),
        },
        relevant_articles: [],
        irrelevant_articles: expect.toIncludeSameMembers([
          { id: "FINANCIAL_SCANDAL", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
        dismissed_articles: expect.toIncludeSameMembers([
          { id: "JOHN_DOE", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
      });

      const { errors: search2Errors, data: search2Data } = await testClient.execute(
        gql`
          query ($token: String!, $search: [AdverseMediaSearchTermInput!]) {
            adverseMediaArticleSearch(token: $token, search: $search) {
              articles {
                totalCount
              }
            }
          }
        `,
        {
          token: buildToken({
            petitionId: petition.id,
            fieldId: field.id,
          }),
          search: [{ entityId: "JANE_SMITH", label: "Jane Smith" }],
        },
      );

      expect(searchArticlesSpy).toHaveBeenNthCalledWith(
        2,
        [{ entityId: "JANE_SMITH", label: "Jane Smith" }],
        { excludeArticles: ["FINANCIAL_SCANDAL", "JOHN_DOE"] },
      );

      expect(search2Errors).toBeUndefined();
      expect(search2Data?.adverseMediaArticleSearch).toEqual({
        articles: {
          totalCount: 3,
        },
      });

      const dbReplies2 = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", field.id)
        .whereNull("deleted_at");

      expect(dbReplies2).toHaveLength(1);
      expect(dbReplies2[0].content).toEqual({
        search: [{ entityId: "JANE_SMITH", label: "Jane Smith" }],
        articles: {
          totalCount: 3,
          items: [
            {
              id: "FINANCIAL_SCANDAL",
              header: "Major bank implicated in money laundering scheme",
              source: "Finance News Network",
              timestamp: 5,
            },
            {
              id: "JANE_SMITH",
              header: "Jane Smith wins prestigious award",
              source: "News Daily",
              timestamp: 2,
            },
            {
              id: "JOHN_DOE",
              header: "John Doe is a good person",
              source: "Google",
              timestamp: 1,
            },
          ],
          createdAt: expect.any(String),
        },
        relevant_articles: [],
        irrelevant_articles: expect.toIncludeSameMembers([
          { id: "FINANCIAL_SCANDAL", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
        dismissed_articles: expect.toIncludeSameMembers([
          { id: "JOHN_DOE", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
      });
    });
  });

  describe("adverseMediaArticleDetails", () => {
    let petition: Petition;
    let field: PetitionField;

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        is_template: false,
      }));

      [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "ADVERSE_MEDIA_SEARCH",
      }));

      await mocks.knex.from("feature_flag_override").delete();
    });

    it("returns the article details", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($articleId: String!, $token: String!) {
            adverseMediaArticleDetails(id: $articleId, token: $token) {
              id
              url
              author
              source
              header
              body
              summary
              quotes
              images
              timestamp
              classification
              classifiedAt
            }
          }
        `,
        {
          articleId: "FINANCIAL_SCANDAL",
          token: buildToken({
            petitionId: petition.id,
            fieldId: field.id,
          }),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.adverseMediaArticleDetails).toEqual({
        id: "FINANCIAL_SCANDAL",
        url: "https://www.financenews.com/investigations",
        author: "Investigative Journalist",
        source: "Finance News Network",
        header: "Major bank implicated in money laundering scheme",
        body: "A major international bank has been implicated in a sophisticated money laundering operation involving billions of dollars. Regulatory authorities from multiple countries are coordinating their investigation into the allegations.",
        summary: "Banking giant faces scrutiny over alleged money laundering activities",
        quotes: [
          "This appears to be one of the largest financial scandals of the decade",
          "The investigation has uncovered systematic failures in compliance procedures",
        ],
        images: [
          "https://www.financenews.com/bank_headquarters.jpg",
          "https://www.financenews.com/evidence_documents.jpg",
        ],
        timestamp: 5,
        classification: null,
        classifiedAt: null,
      });
    });

    it("sends error if user does not have feature flag", async () => {
      await mocks.knex.from("feature_flag_override").insert({
        feature_flag_name: "ADVERSE_MEDIA_SEARCH",
        user_id: user.id,
        value: false,
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!) {
            adverseMediaArticleDetails(id: "FINANCIAL_SCANDAL", token: $token) {
              id
            }
          }
        `,
        {
          token: buildToken({
            petitionId: petition.id,
            fieldId: field.id,
          }),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if article id is not found", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!) {
            adverseMediaArticleDetails(id: "UNKNOWN", token: $token) {
              id
            }
          }
        `,
        {
          token: buildToken({
            petitionId: petition.id,
            fieldId: field.id,
          }),
        },
      );

      expect(errors).toContainGraphQLError("ARTICLE_NOT_FOUND");
      expect(data).toBeNull();
    });
  });

  describe("classifyAdverseMediaArticle", () => {
    let petition: Petition;
    let field: PetitionField;

    beforeEach(async () => {
      [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
        is_template: false,
      }));

      [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
        type: "ADVERSE_MEDIA_SEARCH",
      }));

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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          search: [{ term: "free text search" }],
        },
      );
    });

    it("classifies articles and sets classification data in reply content", async () => {
      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "JANE_SMITH",
          classification: "DISMISSED",
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1?.classifyAdverseMediaArticle).toEqual({
        id: "JANE_SMITH",
        classification: "DISMISSED",
        classifiedAt: expect.any(Date),
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "ELON_MUSK",
          classification: "IRRELEVANT",
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.classifyAdverseMediaArticle).toEqual({
        id: "ELON_MUSK",
        classification: "IRRELEVANT",
        classifiedAt: expect.any(Date),
      });

      const { errors: errors3, data: data3 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "VLADIMIR_PUTIN",
          classification: "RELEVANT",
        },
      );

      expect(errors3).toBeUndefined();
      expect(data3?.classifyAdverseMediaArticle).toEqual({
        id: "VLADIMIR_PUTIN",
        classification: "RELEVANT",
        classifiedAt: expect.any(Date),
      });

      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", field.id)
        .whereNull("deleted_at");

      expect(dbReplies).toHaveLength(1);

      expect(dbReplies[0].content).toEqual({
        search: [{ term: "free text search" }],
        articles: {
          totalCount: 5,
          items: expect.toBeArrayOfSize(5),
          createdAt: expect.any(String),
        },
        relevant_articles: expect.toIncludeSameMembers([
          { id: "VLADIMIR_PUTIN", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
        irrelevant_articles: expect.toIncludeSameMembers([
          { id: "ELON_MUSK", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
        dismissed_articles: expect.toIncludeSameMembers([
          { id: "JANE_SMITH", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($id: GID!) {
            petition(id: $id) {
              id
              fields {
                type
                replies {
                  id
                  content
                }
              }
            }
          }
        `,
        {
          id: toGlobalId("Petition", petition.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.petition).toEqual({
        id: toGlobalId("Petition", petition.id),
        fields: [
          {
            type: "ADVERSE_MEDIA_SEARCH",
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", dbReplies[0].id),
                content: {
                  search: [{ term: "free text search" }],
                  articles: {
                    totalCount: 5,
                    items: [
                      {
                        id: "FINANCIAL_SCANDAL",
                        source: "Finance News Network",
                        header: "Major bank implicated in money laundering scheme",
                        timestamp: 5,
                        classification: null,
                        classifiedAt: null,
                      },
                      {
                        id: "ELON_MUSK",
                        source: "Tech Journal",
                        header: "Elon Musk announces new AI venture",
                        timestamp: 4,
                        classification: "IRRELEVANT",
                        classifiedAt: expect.any(String),
                      },
                      {
                        id: "VLADIMIR_PUTIN",
                        source: "International News",
                        header: "Vladimir Putin makes controversial statement",
                        timestamp: 3,
                        classification: "RELEVANT",
                        classifiedAt: expect.any(String),
                      },
                      {
                        id: "JANE_SMITH",
                        source: "News Daily",
                        header: "Jane Smith wins prestigious award",
                        timestamp: 2,
                        classification: "DISMISSED",
                        classifiedAt: expect.any(String),
                      },
                      {
                        id: "JOHN_DOE",
                        source: "Google",
                        header: "John Doe is a good person",
                        timestamp: 1,
                        classification: null,
                        classifiedAt: null,
                      },
                    ],
                    createdAt: expect.any(String),
                  },
                },
              },
            ],
          },
        ],
      });
    });

    it("sends error if article is not included in reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "UNKNOWN_ARTICLE",
          classification: "DISMISSED",
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("removes classification from article", async () => {
      const { errors: errors1, data: data1 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "JANE_SMITH",
          classification: "DISMISSED",
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1?.classifyAdverseMediaArticle).toEqual({
        id: "JANE_SMITH",
        classification: "DISMISSED",
        classifiedAt: expect.any(Date),
      });

      const { errors: errors2, data: data2 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "ELON_MUSK",
          classification: "IRRELEVANT",
        },
      );

      expect(errors2).toBeUndefined();
      expect(data2?.classifyAdverseMediaArticle).toEqual({
        id: "ELON_MUSK",
        classification: "IRRELEVANT",
        classifiedAt: expect.any(Date),
      });

      const { errors: errors3, data: data3 } = await testClient.execute(
        gql`
          mutation (
            $token: String!
            $articleId: String!
            $classification: AdverseMediaArticleRelevance
          ) {
            classifyAdverseMediaArticle(
              token: $token
              id: $articleId
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
            petitionId: petition.id,
            fieldId: field.id,
          }),
          articleId: "JANE_SMITH",
          classification: null,
        },
      );

      expect(errors3).toBeUndefined();
      expect(data3?.classifyAdverseMediaArticle).toEqual({
        id: "JANE_SMITH",
        classification: null,
        classifiedAt: null,
      });

      const dbReplies = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", field.id)
        .whereNull("deleted_at");

      expect(dbReplies).toHaveLength(1);

      expect(dbReplies[0].content).toEqual({
        search: [{ term: "free text search" }],
        articles: {
          totalCount: 5,
          items: expect.toBeArrayOfSize(5),
          createdAt: expect.any(String),
        },
        relevant_articles: [],
        irrelevant_articles: expect.toIncludeSameMembers([
          { id: "ELON_MUSK", added_at: expect.any(String), added_by_user_id: user.id },
        ]),
        dismissed_articles: [],
      });

      const { errors: queryErrors, data: queryData } = await testClient.execute(
        gql`
          query ($id: GID!) {
            petition(id: $id) {
              id
              fields {
                type
                replies {
                  id
                  content
                }
              }
            }
          }
        `,
        {
          id: toGlobalId("Petition", petition.id),
        },
      );

      expect(queryErrors).toBeUndefined();
      expect(queryData?.petition).toEqual({
        id: toGlobalId("Petition", petition.id),
        fields: [
          {
            type: "ADVERSE_MEDIA_SEARCH",
            replies: [
              {
                id: toGlobalId("PetitionFieldReply", dbReplies[0].id),
                content: {
                  search: [{ term: "free text search" }],
                  articles: {
                    totalCount: 5,
                    items: [
                      {
                        id: "FINANCIAL_SCANDAL",
                        source: "Finance News Network",
                        header: "Major bank implicated in money laundering scheme",
                        timestamp: 5,
                        classification: null,
                        classifiedAt: null,
                      },
                      {
                        id: "ELON_MUSK",
                        source: "Tech Journal",
                        header: "Elon Musk announces new AI venture",
                        timestamp: 4,
                        classification: "IRRELEVANT",
                        classifiedAt: expect.any(String),
                      },
                      {
                        id: "VLADIMIR_PUTIN",
                        source: "International News",
                        header: "Vladimir Putin makes controversial statement",
                        timestamp: 3,
                        classification: null,
                        classifiedAt: null,
                      },
                      {
                        id: "JANE_SMITH",
                        source: "News Daily",
                        header: "Jane Smith wins prestigious award",
                        timestamp: 2,
                        classification: null,
                        classifiedAt: null,
                      },
                      {
                        id: "JOHN_DOE",
                        source: "Google",
                        header: "John Doe is a good person",
                        timestamp: 1,
                        classification: null,
                        classifiedAt: null,
                      },
                    ],
                    createdAt: expect.any(String),
                  },
                },
              },
            ],
          },
        ],
      });
    });
  });
});
