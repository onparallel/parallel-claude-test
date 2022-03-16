import { addDays } from "date-fns";
import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, PetitionEventSubscription, User } from "../../db/__types";
import { FETCH_SERVICE, IFetchService } from "../../services/fetch";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/PetitionEventSubscription", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let sessionUser: User;
  let otherUser: User;

  let subscriptions: PetitionEventSubscription[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    let organization: Organization;

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());

    [otherUser] = await mocks.createRandomUsers(organization.id, 1, (i) => ({
      cognito_id: "1234",
      first_name: "Harvey",
      last_name: "Specter",
    }));

    subscriptions = await mocks.createEventSubscription([
      { user_id: otherUser.id, endpoint: "https://www.endpoint-1.com" },
      { user_id: sessionUser.id, endpoint: "https://www.endpoint-2.com", created_at: new Date() },
      {
        user_id: sessionUser.id,
        endpoint: "https://www.endpoint-3.com",
        is_enabled: false,
        created_at: addDays(new Date(), 1),
      },
    ]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("Queries", () => {
    afterAll(async () => {
      // delete session user's subscriptions so we will able to create new ones in the next tests
      await mocks.knex
        .from("petition_event_subscription")
        .where({ user_id: sessionUser.id })
        .update({ deleted_at: new Date() });
    });
    it("fetches user's subscriptions ordered by creation date", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query {
            subscriptions {
              id
              eventsUrl
              isEnabled
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data?.subscriptions).toEqual([
        {
          id: toGlobalId("PetitionEventSubscription", subscriptions[2].id),
          eventsUrl: "https://www.endpoint-3.com",
          isEnabled: false,
        },
        {
          id: toGlobalId("PetitionEventSubscription", subscriptions[1].id),
          eventsUrl: "https://www.endpoint-2.com",
          isEnabled: true,
        },
      ]);
    });
  });

  let subscriptionId: string;
  describe("createEventSubscription", () => {
    it("creates and returns a new subscription for the user's petitions", async () => {
      const fetch = testClient.container.get<IFetchService>(FETCH_SERVICE);
      const spy = jest.spyOn(fetch, "fetchWithTimeout");
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($eventsUrl: String!, $name: String) {
            createEventSubscription(eventsUrl: $eventsUrl, name: $name) {
              id
              name
              eventsUrl
              isEnabled
            }
          }
        `,
        variables: {
          eventsUrl: "https://www.example.com/api",
          name: "example",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createEventSubscription).toMatchObject({
        isEnabled: true,
        name: "example",
        eventsUrl: "https://www.example.com/api",
      });
      subscriptionId = data!.createEventSubscription.id;
      expect(spy).toHaveBeenCalledWith(
        "https://www.example.com/api",
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe("updateEventSubscription", () => {
    it("disables a subscription for the user's petitions", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $isEnabled: Boolean!) {
            updateEventSubscription(id: $id, isEnabled: $isEnabled) {
              id
              eventsUrl
              isEnabled
            }
          }
        `,
        variables: {
          id: subscriptionId,
          isEnabled: false,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateEventSubscription).toEqual({
        id: subscriptionId,
        eventsUrl: "https://www.example.com/api",
        isEnabled: false,
      });
    });

    it("throws error if trying to update another user's subscription", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $isEnabled: Boolean!) {
            updateEventSubscription(id: $id, isEnabled: $isEnabled) {
              id
            }
          }
        `,
        variables: {
          id: toGlobalId("PetitionEventSubscription", subscriptions[0].id),
          isEnabled: true,
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("deleteEventSubscription", () => {
    it("deletes an user's subscription", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!) {
            deleteEventSubscriptions(ids: $ids)
          }
        `,
        variables: {
          ids: [subscriptionId],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deleteEventSubscriptions).toEqual("SUCCESS");
    });

    it("throws error if the trying to delete a subscription of another user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!) {
            deleteEventSubscriptions(ids: $ids)
          }
        `,
        variables: {
          ids: [toGlobalId("PetitionEventSubscription", subscriptions[0].id)],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
