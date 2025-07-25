import gql from "graphql-tag";
import { Container } from "inversify";
import { Knex } from "knex";
import { Organization, Petition, PetitionField, PetitionFieldReply, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  BACKGROUND_CHECK_SERVICE,
  IBackgroundCheckService,
} from "../../services/BackgroundCheckService";
import { toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("Background Check - Petitions", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let container: Container;
  let user: User;
  let organization: Organization;

  let petition: Petition;
  let field: PetitionField;

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
    container = testClient.container;
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization(() => ({
      name: "Parallel",
      status: "DEV",
    })));

    await mocks.createFeatureFlags([{ name: "BACKGROUND_CHECK", default_value: true }]);

    await mocks.createOrganizationUsageLimit(organization.id, "PETITION_SEND", 100);

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
      is_template: false,
    }));

    [field] = await mocks.createRandomPetitionFields(petition.id, 1, () => ({
      type: "BACKGROUND_CHECK",
    }));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  afterEach(async () => {
    await mocks.knex("petition_signature_request").delete();
    await mocks.knex("petition_approval_request_step").delete();
  });

  describe("backgroundCheckEntitySearch", () => {
    let backgroundCheckServiceSpy: jest.SpyInstance;

    beforeEach(async () => {
      backgroundCheckServiceSpy = jest.spyOn(
        container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE),
        "entitySearch",
      );
    });

    afterEach(async () => {
      backgroundCheckServiceSpy.mockClear();
      await mocks.knex.from("petition_field_reply").delete();
    });

    it("creates a reply with the search on the field if field has no replies", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({ totalCount: 2 });

      const replies = await mocks.knex
        .from("petition_field_reply")
        .where({ petition_field_id: field.id, deleted_at: null })
        .orderBy("created_at")
        .select("*");

      expect(replies).toHaveLength(1);
      expect(replies[0]).toMatchObject({
        id: expect.any(Number),
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
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith({
        name: "Vladimir Putin",
        date: null,
        type: null,
        country: null,
        birthCountry: null,
      });
    });

    it("returns reply content if reply is found with same search query", async () => {
      await mocks.createPetitionFieldReply(field.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        user_id: user.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
            type: "PERSON",
            country: "RU",
            birthCountry: "GB",
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
      }));

      const { errors, data } = await testClient.execute(
        gql`
          query (
            $token: String!
            $name: String!
            $date: Date
            $type: BackgroundCheckEntitySearchType
            $country: String
            $birthCountry: String
          ) {
            backgroundCheckEntitySearch(
              token: $token
              name: $name
              date: $date
              type: $type
              country: $country
              birthCountry: $birthCountry
            ) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
          date: "1990-10-10",
          type: "PERSON",
          country: "RU",
          birthCountry: "GB",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({ totalCount: 1 });

      expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
    });

    it("updates the reply the new search if query is different from the last reply", async () => {
      const [reply] = await mocks.createPetitionFieldReply(field.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        user_id: user.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
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
            createdAt: new Date().toISOString(),
          },
          entity: {
            id: "Q7747",
            type: "Person",
            name: "Vladimir Vladimirovich PUTIN",
            properties: {},
          },
        },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          query (
            $token: String!
            $name: String!
            $date: Date
            $type: BackgroundCheckEntitySearchType
            $country: String
          ) {
            backgroundCheckEntitySearch(
              token: $token
              name: $name
              date: $date
              type: $type
              country: $country
            ) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
          type: "COMPANY",
          country: null,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({ totalCount: 1 });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith({
        name: "Vladimir Putin",
        date: null,
        country: null,
        type: "COMPANY",
        birthCountry: null,
      });

      const replies = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", field.id)
        .orderBy("created_at")
        .select("*");

      expect(replies).toHaveLength(1);
      expect(replies[0]).toMatchObject({
        id: reply.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: null,
            type: "COMPANY",
            country: null,
            birthCountry: null,
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
        deleted_at: null,
        deleted_by: null,
      });
    });

    it("sends error if the search query is different and old reply is already approved", async () => {
      await mocks.createPetitionFieldReply(field.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        user_id: user.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
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
            createdAt: new Date().toISOString(),
          },
          entity: null,
        },
        status: "APPROVED",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          query (
            $token: String!
            $name: String!
            $date: Date
            $type: BackgroundCheckEntitySearchType
          ) {
            backgroundCheckEntitySearch(token: $token, name: $name, date: $date, type: $type) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
          type: "COMPANY",
        },
      );

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();

      expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
    });

    it("sends error if there is an ongoing signature request", async () => {
      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if there is an ongoing approval request", async () => {
      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "APPROVED",
        approval_type: "ANY",
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("searching on a template should not store reply in DB", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, user.id, 1);
      const [templateField] = await mocks.createRandomPetitionFields(template.id, 1, () => ({
        type: "BACKGROUND_CHECK",
      }));

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: template.id, fieldId: templateField.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data).not.toBeNull();
      expect(backgroundCheckServiceSpy).toHaveBeenCalledOnce();

      const replies = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", templateField.id)
        .select("*");

      expect(replies).toHaveLength(0);
    });

    it("forces a search update with same search criteria", async () => {
      await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
        },
      );

      const { errors, data } = await testClient.execute(
        gql`
          query ($token: String!, $name: String!) {
            backgroundCheckEntitySearch(token: $token, name: $name, force: true) {
              totalCount
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Vladimir Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data).not.toBeNull();
      expect(backgroundCheckServiceSpy).toHaveBeenCalledTimes(2);
      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(1, {
        name: "Vladimir Putin",
        date: null,
        type: null,
        country: null,
        birthCountry: null,
      });
      expect(backgroundCheckServiceSpy).toHaveBeenNthCalledWith(2, {
        name: "Vladimir Putin",
        date: null,
        type: null,
        country: null,
        birthCountry: null,
      });
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
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Putin",
        },
      );

      expect(errors1).toBeUndefined();
      expect(data1?.backgroundCheckEntitySearch).toEqual({
        totalCount: 2,
        items: [{ id: "Q7747" }, { id: "rupep-company-718" }],
      });

      // mark a false positive
      await testClient.execute(
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
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityIds: ["Q7747", "rupep-company-718"],
        },
      );

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
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          name: "Putin",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntitySearch).toEqual({
        totalCount: 1,
        items: [{ id: "Q7747", isFalsePositive: true }],
      });

      const [reply] = await mocks.knex
        .from("petition_field_reply")
        .where("petition_field_id", field.id)
        .whereNull("deleted_at")
        .select("*");

      expect(reply.content).toEqual({
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
      });
    });
  });

  describe("backgroundCheckEntityDetails", () => {
    let backgroundCheckServiceSpy: jest.SpyInstance;
    beforeEach(async () => {
      backgroundCheckServiceSpy = jest.spyOn(
        container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE),
        "entityProfileDetails",
      );
    });

    afterEach(async () => {
      backgroundCheckServiceSpy.mockClear();
      await mocks.knex.from("petition_field_reply").delete();
    });

    it("searches for an entity in background check service", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($entityId: String!, $token: String!) {
            backgroundCheckEntityDetails(entityId: $entityId, token: $token) {
              id
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntityDetails).toEqual({ id: "Q7747" });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id);
    });

    it("sends error if entityId is unknown", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($entityId: String!, $token: String!) {
            backgroundCheckEntityDetails(entityId: $entityId, token: $token) {
              id
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "qweasd",
        },
      );

      expect(errors).toContainGraphQLError("PROFILE_NOT_FOUND");
      expect(data).toBeNull();

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("qweasd", user.id);
    });

    it("returns reply with entity details if found", async () => {
      await mocks.createPetitionFieldReply(field.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        user_id: user.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
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
            createdAt: new Date().toISOString(),
          },
          entity: {
            id: "Q7747",
            type: "Person",
            name: "Vladimir Vladimirovich PUTIN",
            properties: {},
          },
        },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          query ($entityId: String!, $token: String!) {
            backgroundCheckEntityDetails(entityId: $entityId, token: $token) {
              id
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntityDetails).toEqual({ id: "Q7747" });

      expect(backgroundCheckServiceSpy).not.toHaveBeenCalled();
    });

    it("updates entity details if forcing a refresh", async () => {
      await mocks.createPetitionFieldReply(field.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        user_id: user.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
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
            createdAt: new Date().toISOString(),
          },
          entity: {
            id: "Q7747",
            type: "Person",
            name: "Vladimir V PUTIN",
            properties: {},
          },
        },
      }));

      const { errors, data } = await testClient.execute(
        gql`
          query ($entityId: String!, $token: String!) {
            backgroundCheckEntityDetails(entityId: $entityId, token: $token, force: true) {
              id
              name
            }
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.backgroundCheckEntityDetails).toEqual({
        id: "Q7747",
        name: "Vladimir Vladimirovich PUTIN",
      });

      expect(backgroundCheckServiceSpy).toHaveBeenCalledExactlyOnceWith("Q7747", user.id, {
        skipCache: true,
      });
    });
  });

  describe("updateBackgroundCheckEntity", () => {
    let backgroundCheckServiceSpy: jest.SpyInstance;

    let reply: PetitionFieldReply;
    beforeEach(async () => {
      backgroundCheckServiceSpy = jest.spyOn(
        container.get<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE),
        "entityProfileDetails",
      );

      [reply] = await mocks.createPetitionFieldReply(field.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        user_id: user.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
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
            createdAt: new Date().toISOString(),
          },
          entity: null,
        },
      }));
    });

    afterEach(async () => {
      backgroundCheckServiceSpy.mockClear();
      await mocks.knex.from("petition_field_reply").delete();
    });

    it("sends error if reply cant be found", async () => {
      await mocks.knex.from("petition_field_reply").where("id", reply.id).delete();

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toContainGraphQLError("REPLY_NOT_FOUND");
      expect(data).toBeNull();
    });

    it("sends error if reply is already approved", async () => {
      await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .update({ status: "APPROVED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toContainGraphQLError("REPLY_ALREADY_APPROVED_ERROR");
      expect(data).toBeNull();
    });

    it("updates the entity of a reply", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckEntity).toEqual("SUCCESS");

      const [dbReply] = await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .select("*");

      expect(dbReply).toMatchObject({
        id: reply.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
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
            createdAt: reply.content.search.createdAt,
          },
          entity: {
            id: "Q7747",
            type: "Person",
            name: "Vladimir Vladimirovich PUTIN",
            properties: {},
          },
        },
        deleted_at: null,
        deleted_by: null,
      });
    });

    it("nulls the entity of a reply", async () => {
      await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .update({
          content: {
            ...reply.content,
            entity: {
              id: "Q7747",
              type: "Person",
              name: "Vladimir Vladimirovich PUTIN",
              properties: {},
            },
          },
        });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: null,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckEntity).toEqual("SUCCESS");

      const [dbReply] = await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .select("*");

      expect(dbReply).toMatchObject({
        id: reply.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
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
            createdAt: reply.content.search.createdAt,
          },
          entity: null,
        },
        deleted_at: null,
        deleted_by: null,
      });
    });

    it("sends error if there is an ongoing signature request", async () => {
      await mocks.knex
        .from("petition_signature_request")
        .insert({ petition_id: petition.id, signature_config: {}, status: "PROCESSED" });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_SIGNATURE_REQUEST_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if there is an ongoing approval request", async () => {
      await mocks.knex.from("petition_approval_request_step").insert({
        petition_id: petition.id,
        step_number: 0,
        step_name: "Step 1",
        status: "APPROVED",
        approval_type: "ANY",
      });

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($token: String!, $entityId: String) {
            updateBackgroundCheckEntity(token: $token, entityId: $entityId)
          }
        `,
        {
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityId: "Q7747",
        },
      );

      expect(errors).toContainGraphQLError("ONGOING_APPROVAL_REQUEST_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateBackgroundCheckSearchFalsePositives", () => {
    let reply: PetitionFieldReply;
    beforeEach(async () => {
      [reply] = await mocks.createPetitionFieldReply(field.id, 1, () => ({
        type: "BACKGROUND_CHECK",
        user_id: user.id,
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
            type: "PERSON",
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
      }));
    });

    afterEach(async () => {
      await mocks.knex.from("petition_field_reply").delete();
    });

    it("sets a result item as false positive", async () => {
      const { errors, data } = await testClient.execute(
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
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityIds: ["Q7747"],
          isFalsePositive: true,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckSearchFalsePositives).toEqual("SUCCESS");

      const [dbReply] = await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .select("*");

      expect(dbReply).toMatchObject({
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
            type: "PERSON",
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
          },
          entity: null,
          falsePositives: [{ id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id }],
        },
        deleted_at: null,
        deleted_by: null,
      });
    });

    it("removes a false positive", async () => {
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
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityIds: ["Q7747", "rupep-company-718"],
          isFalsePositive: true,
        },
      );

      const { errors, data } = await testClient.execute(
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
          token: buildToken({ petitionId: petition.id, fieldId: field.id }),
          entityIds: ["rupep-company-718"],
          isFalsePositive: false,
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateBackgroundCheckSearchFalsePositives).toEqual("SUCCESS");

      const [dbReply] = await mocks.knex
        .from("petition_field_reply")
        .where("id", reply.id)
        .select("*");

      expect(dbReply).toMatchObject({
        content: {
          query: {
            name: "Vladimir Putin",
            date: "1990-10-10",
            type: "PERSON",
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
          },
          entity: null,
          falsePositives: [{ id: "Q7747", addedAt: expect.any(String), addedByUserId: user.id }],
        },
        deleted_at: null,
        deleted_by: null,
      });
    });
  });
});
