import { gql } from "@apollo/client";
import { addDays } from "date-fns";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, OrgIntegration, User } from "../../db/__types";
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
        type: "EVENT_SUBSCRIPTION",
        provider: "PARALLEL",
        settings: {
          EVENTS_URL: "https://www.example.com",
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
        is_enabled: true,
      }),
      mocks.createOrgIntegration({
        org_id: organization.id,
        type: "SSO",
        provider: "AZURE",
        settings: {
          EMAIL_DOMAINS: ["onparallel.com"],
          COGNITO_PROVIDER: "AZURE",
        },
        is_enabled: false,
        created_at: addDays(new Date(), 2),
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
        id: toGlobalId("OrgIntegration", integrations[2].id),
        name: "Azure",
        type: "SSO",
        provider: "AZURE",
        settings: {},
        isEnabled: false,
      },
      {
        id: toGlobalId("OrgIntegration", integrations[1].id),
        name: "Signaturit",
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        settings: {},
        isEnabled: true,
      },
      {
        id: toGlobalId("OrgIntegration", integrations[0].id),
        name: "Parallel",
        type: "EVENT_SUBSCRIPTION",
        provider: "PARALLEL",
        settings: { EVENTS_URL: "https://www.example.com" },
        isEnabled: true,
      },
    ]);
  });

  describe("createOrgIntegration", () => {
    it("creates and returns a new integration on the user's organization", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($type: IntegrationType!, $provider: String!, $settings: JSONObject!) {
            createOrgIntegration(type: $type, provider: $provider, settings: $settings) {
              name
              type
              isEnabled
            }
          }
        `,
        variables: {
          type: "USER_PROVISIONING",
          provider: "COGNITO",
          settings: { AUTH_KEY: "<AUTH_KEY>" },
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createOrgIntegration).toEqual({
        name: "Cognito",
        type: "USER_PROVISIONING",
        isEnabled: true,
      });
    });

    it("throws error if trying to create an integration with same type and provider", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation ($type: IntegrationType!, $provider: String!, $settings: JSONObject!) {
            createOrgIntegration(type: $type, provider: $provider, settings: $settings) {
              id
            }
          }
        `,
        variables: {
          type: "EVENT_SUBSCRIPTION",
          provider: "PARALLEL",
          settings: { EVENTS_URL: "https://www.example.com/api" },
        },
      });

      expect(data).toBeNull();
      expect(errors).toContainGraphQLError("EXISTING_INTEGRATION_ERROR");
    });
  });

  describe("updateOrgIntegration", () => {
    it("updates an integration on the user's organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $type: IntegrationType!, $data: UpdateOrgIntegrationInput!) {
            updateOrgIntegration(id: $id, type: $type, data: $data) {
              id
              settings
              isEnabled
            }
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[1].id),
          type: integrations[1].type,
          data: {
            isEnabled: false,
            settings: { API_KEY: "<ANOTHER_API_KEY>" },
          },
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateOrgIntegration).toEqual({
        id: toGlobalId("OrgIntegration", integrations[1].id),
        settings: {},
        isEnabled: false,
      });

      const [signatureIntegration] = await mocks.knex
        .from<OrgIntegration>("org_integration")
        .where("id", integrations[1].id)
        .select("*");
      // read this directly from DB as we dont expose APIKEYS with graphql
      expect(signatureIntegration.settings).toEqual({ API_KEY: "<ANOTHER_API_KEY>" });
    });

    it("throws error if passed type doesn't match", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $type: IntegrationType!, $data: UpdateOrgIntegrationInput!) {
            updateOrgIntegration(id: $id, type: $type, data: $data) {
              id
              settings
              isEnabled
            }
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[2].id),
          type: "USER_PROVISIONING",
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
          mutation ($id: GID!, $type: IntegrationType!, $data: UpdateOrgIntegrationInput!) {
            updateOrgIntegration(id: $id, type: $type, data: $data) {
              id
              settings
              isEnabled
            }
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[2].id),
          type: integrations[2].type,
          data: {},
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("throws error if trying to update integration with invalid settings", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $type: IntegrationType!, $data: UpdateOrgIntegrationInput!) {
            updateOrgIntegration(id: $id, type: $type, data: $data) {
              id
              settings
              isEnabled
            }
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[0].id),
          type: integrations[0].type,
          data: { settings: { INVALID_KEY: true } },
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("deleteOrgIntegration", () => {
    it("deletes an integration in the user's organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $type: IntegrationType!) {
            deleteOrgIntegration(id: $id, type: $type)
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[0].id),
          type: integrations[0].type,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deleteOrgIntegration).toEqual("SUCCESS");
    });

    it("throws error if the integration type doesn't match", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $type: IntegrationType!) {
            deleteOrgIntegration(id: $id, type: $type)
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[1].id),
          type: "SSO",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("allows to create a new integration of same type and provider after deleting it", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($id: GID!, $type: IntegrationType!) {
            deleteOrgIntegration(id: $id, type: $type)
          }
        `,
        variables: {
          id: toGlobalId("OrgIntegration", integrations[2].id),
          type: integrations[2].type,
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deleteOrgIntegration).toEqual("SUCCESS");

      const { errors: createErrors, data: createData } = await testClient.mutate({
        mutation: gql`
          mutation ($type: IntegrationType!, $provider: String!, $settings: JSONObject!) {
            createOrgIntegration(type: $type, provider: $provider, settings: $settings) {
              type
              isEnabled
            }
          }
        `,
        variables: {
          type: integrations[2].type,
          provider: integrations[2].provider,
          settings: integrations[2].settings,
        },
      });

      expect(createErrors).toBeUndefined();
      expect(createData?.createOrgIntegration).toEqual({
        type: integrations[2].type,
        isEnabled: true,
      });
    });
  });
});
