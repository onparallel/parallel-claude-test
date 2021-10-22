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

  it("fetches all user's org integrations ordered by created_at DESC", async () => {
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
                isEnabled
              }
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me.organization.integrations).toEqual([
      {
        id: toGlobalId("OrgIntegration", integrations[1].id),
        name: "Signaturit",
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        settings: {},
        isEnabled: false,
      },
      {
        id: toGlobalId("OrgIntegration", integrations[0].id),
        name: "Cognito",
        type: "USER_PROVISIONING",
        provider: "COGNITO",
        settings: {},
        isEnabled: true,
      },
    ]);
  });

  let subscriptionId: string;
  describe("createEventSubscriptionIntegration", () => {
    it("creates and returns a new subscription on the user's organization", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($settings: JSONObject!) {
            createEventSubscriptionIntegration(settings: $settings) {
              id
              name
              type
              isEnabled
            }
          }
        `,
        variables: {
          settings: { EVENTS_URL: "https://www.example.com/api" },
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createEventSubscriptionIntegration).toMatchObject({
        name: "Parallel",
        type: "EVENT_SUBSCRIPTION",
        isEnabled: true,
      });
      subscriptionId = data!.createEventSubscriptionIntegration.id;
    });

    it("throws error if trying to create a second subscription integration", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($settings: JSONObject!) {
            createEventSubscriptionIntegration(settings: $settings) {
              id
            }
          }
        `,
        variables: {
          settings: { EVENTS_URL: "https://www.example.com/api" },
        },
      });

      expect(data).toBeNull();
      expect(errors).toContainGraphQLError("EXISTING_INTEGRATION_ERROR");
    });
  });

  describe("updateEventSubscriptionIntegration", () => {
    it("updates an subscription on the user's organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateOrgIntegrationInput!) {
            updateEventSubscriptionIntegration(id: $id, data: $data) {
              id
              settings
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
      expect(data?.updateEventSubscriptionIntegration).toEqual({
        id: subscriptionId,
        settings: {
          EVENTS_URL: "https://www.example.com/api",
        },
        isEnabled: false,
      });
    });

    it("throws error if integration is not of type EVENT_SUBSCRIPTION", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateOrgIntegrationInput!) {
            updateEventSubscriptionIntegration(id: $id, data: $data) {
              id
              settings
              isEnabled
            }
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[1].id),
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
          mutation ($id: GID!, $data: UpdateOrgIntegrationInput!) {
            updateEventSubscriptionIntegration(id: $id, data: $data) {
              id
              settings
              isEnabled
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

    it("throws error if trying to update integration with invalid settings", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $data: UpdateOrgIntegrationInput!) {
            updateEventSubscriptionIntegration(id: $id, data: $data) {
              id
              settings
              isEnabled
            }
          }
        `,
        variables: {
          id: subscriptionId,
          data: { settings: { INVALID_KEY: true } },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deleteEventSubscriptionIntegration", () => {
    it("deletes an integration in the user's organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!) {
            deleteEventSubscriptionIntegration(id: $id)
          }
        `,
        variables: {
          id: subscriptionId,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deleteEventSubscriptionIntegration).toEqual("SUCCESS");
    });

    it("throws error if the integration is not of type EVENT_SUBSCRIPTION", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!) {
            deleteEventSubscriptionIntegration(id: $id)
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[1].id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
