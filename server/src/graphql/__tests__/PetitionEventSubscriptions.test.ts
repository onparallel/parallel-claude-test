import { gql } from "graphql-request";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { PetitionEventSubscription, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionEventSubscription", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let sessionUser: User;
  let otherUser: User;

  let otherUserSubscription: PetitionEventSubscription;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    const [organization] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));

    [sessionUser, otherUser] = await mocks.createRandomUsers(organization.id, 2, (i) => ({
      cognito_id: i === 0 ? USER_COGNITO_ID : "1234",
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
    }));

    [otherUserSubscription] = await mocks.createEventSubscription([
      { user_id: otherUser.id, endpoint: "https://www.other-endpoint.com" },
    ]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  let subscriptionId: string;
  describe("createEventSubscription", () => {
    it("creates and returns a new subscription for the user's petitions", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($eventsUrl: String!) {
            createEventSubscription(eventsUrl: $eventsUrl) {
              id
              eventsUrl
              isEnabled
            }
          }
        `,
        variables: {
          eventsUrl: "https://www.example.com/api",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createEventSubscription).toMatchObject({
        isEnabled: true,
        eventsUrl: "https://www.example.com/api",
      });
      subscriptionId = data!.createEventSubscription.id;
    });

    it("throws error if trying to create a second subscription", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($eventsUrl: String!) {
            createEventSubscription(eventsUrl: $eventsUrl) {
              id
            }
          }
        `,
        variables: {
          eventsUrl: "https://www.example.com/api",
        },
      });

      expect(data).toBeNull();
      expect(errors).toContainGraphQLError("EXISTING_SUBSCRIPTION_ERROR");
    });
  });

  describe("updateEventSubscription", () => {
    it("disables a subscription for the user's petitions", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateEventSubscriptionInput!) {
            updateEventSubscription(id: $id, data: $data) {
              id
              eventsUrl
              isEnabled
            }
          }
        `,
        variables: {
          id: subscriptionId,
          data: {
            isEnabled: false,
          },
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateEventSubscription).toEqual({
        id: subscriptionId,
        eventsUrl: "https://www.example.com/api",
        isEnabled: false,
      });
    });

    it("updates the settings of a subscription ", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateEventSubscriptionInput!) {
            updateEventSubscription(id: $id, data: $data) {
              id
              eventsUrl
              isEnabled
            }
          }
        `,
        variables: {
          id: subscriptionId,
          data: {
            eventsUrl: "https://www.example.com/new-api",
            isEnabled: true,
          },
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateEventSubscription).toEqual({
        id: subscriptionId,
        eventsUrl: "https://www.example.com/new-api",
        isEnabled: true,
      });
    });

    it("throws error if trying to update another user's subscription", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateEventSubscriptionInput!) {
            updateEventSubscription(id: $id, data: $data) {
              id
            }
          }
        `,
        variables: {
          id: toGlobalId("PetitionEventSubscription", otherUserSubscription.id),
          data: {
            isEnabled: true,
          },
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("throws error if update data is empty", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateEventSubscriptionInput!) {
            updateEventSubscription(id: $id, data: $data) {
              id
            }
          }
        `,
        variables: {
          id: subscriptionId,
          data: {},
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("throws error if trying to update subscription with invalid URL", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateEventSubscriptionInput!) {
            updateEventSubscription(id: $id, data: $data) {
              id
            }
          }
        `,
        variables: {
          id: subscriptionId,
          data: { eventsUrl: "invalid url!" },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deleteEventSubscription", () => {
    it("deletes an user's subscription", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!) {
            deleteEventSubscription(id: $id)
          }
        `,
        variables: {
          id: subscriptionId,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deleteEventSubscription).toEqual("SUCCESS");
    });

    it("throws error if the trying to delete a subscription of another user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!) {
            deleteEventSubscription(id: $id)
          }
        `,
        variables: {
          id: toGlobalId("PetitionEventSubscription", otherUserSubscription.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
