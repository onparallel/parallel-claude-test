import { gql } from "@apollo/client";
import { addDays } from "date-fns";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { OrgIntegration } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/OrgIntegrations", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let integrations: OrgIntegration[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    const [organization] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));

    await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
    }));

    integrations = await Promise.all([
      mocks.createOrgIntegration({
        org_id: organization.id,
        type: "USER_PROVISIONING",
        provider: "COGNITO",
        settings: {
          AUTH_KEY: "<AUTH_KEY>",
        },
        created_at: new Date(),
        is_enabled: true,
      }),
      mocks.createOrgIntegration({
        org_id: organization.id,
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        settings: {
          API_KEY: "<APIKEY>",
        },
        created_at: addDays(new Date(), 1),
        is_enabled: false,
      }),
    ]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  it("fetches all user's enabled integrations ordered by created_at DESC", async () => {
    const { data, errors } = await testClient.query({
      query: gql`
        query {
          me {
            organization {
              integrations {
                id
                name
                type
                provider
                settings
              }
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me.organization.integrations).toEqual([
      {
        id: toGlobalId("OrgIntegration", integrations[0].id),
        name: "Cognito",
        type: "USER_PROVISIONING",
        provider: "COGNITO",
        settings: {},
      },
    ]);
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

    it.todo("FIX: throws error if subscription is from another user");
    // , async () => {
    //   const { errors, data } = await testClient.mutate({
    //     mutation: gql`
    //       mutation ($id: GID!, $data: UpdateEventSubscriptionInput!) {
    //         updateEventSubscription(id: $id, data: $data) {
    //           id
    //         }
    //       }
    //     `,
    //     variables: {
    //       id: toGlobalId("PetitionEventSubscription", integrations[1].id),
    //       data: {
    //         isEnabled: true,
    //       },
    //     },
    //   });
    //
    //   expect(errors).toContainGraphQLError("FORBIDDEN");
    //   expect(data).toBeNull();
    // });

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

    it.todo("FIX: throws error if the trying to delete a subscription of another user");
    // , async () => {
    //   const { errors, data } = await testClient.mutate({
    //     mutation: gql`
    //       mutation ($id: GID!) {
    //         deleteEventSubscriptionIntegration(id: $id)
    //       }
    //     `,
    //     variables: {
    //       id: toGlobalId("OrgIntegration", integrations[1].id),
    //     },
    //   });

    //   expect(errors).toContainGraphQLError("FORBIDDEN");
    //   expect(data).toBeNull();
    // });
  });
});
