import { gql } from "@apollo/client";
import { addDays } from "date-fns";
import { Knex } from "knex";
import { omit } from "remeda";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  OrgIntegration,
  Petition,
  PetitionSignatureRequest,
  User,
} from "../../db/__types";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/OrgIntegrations", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let integrations: OrgIntegration[];
  let organization: Organization;
  let user: User;

  let petition: Petition;
  let signatureRequest: PetitionSignatureRequest;

  let normalUserApiKey: string;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization("ADMIN"));

    const [normalUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      organization_role: "NORMAL",
    }));
    ({ apiKey: normalUserApiKey } = await mocks.createUserAuthToken("normal-token", normalUser.id));

    integrations = await mocks.createOrgIntegration([
      {
        org_id: organization.id,
        name: "SCIM user provisioning",
        type: "USER_PROVISIONING",
        provider: "SCIM",
        settings: {
          AUTH_KEY: "<AUTH_KEY>",
        },
        created_at: new Date(),
        is_enabled: true,
      },
      {
        org_id: organization.id,
        name: "Signaturit",
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        settings: {
          CREDENTIALS: {
            API_KEY: "<APIKEY>",
          },
        },
        created_at: addDays(new Date(), 1),
        is_enabled: true,
        is_default: true,
      },
      {
        org_id: organization.id,
        name: "Signaturit 2",
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        settings: {
          CREDENTIALS: {
            API_KEY: "<APIKEY>",
          },
        },
        created_at: addDays(new Date(), 1),
        is_enabled: false,
      },
    ]);

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    [signatureRequest] = await mocks.knex
      .from<PetitionSignatureRequest>("petition_signature_request")
      .insert(
        {
          petition_id: petition.id,
          status: "PROCESSED",
          signature_config: {
            orgIntegrationId: integrations[1].id,
            signersInfo: [],
            timezone: "Europe/Madrid",
            title: "test",
            allowAdditionalSigners: true,
            review: false,
          },
        },
        "*"
      );

    await mocks.createFeatureFlags([{ name: "PETITION_SIGNATURE", default_value: true }]);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  it("fetches all organization enabled integrations ordered by created_at DESC", async () => {
    const { data, errors } = await testClient.query({
      query: gql`
        query {
          me {
            organization {
              integrations(limit: 100) {
                totalCount
                items {
                  id
                  name
                  type
                  isDefault
                  ... on SignatureOrgIntegration {
                    provider
                  }
                }
              }
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data?.me.organization.integrations).toEqual({
      totalCount: 2,
      items: [
        {
          id: toGlobalId("OrgIntegration", integrations[1].id),
          name: "Signaturit",
          type: "SIGNATURE",
          provider: "SIGNATURIT",
          isDefault: true,
        },
        {
          id: toGlobalId("OrgIntegration", integrations[0].id),
          name: "SCIM user provisioning",
          type: "USER_PROVISIONING",
          isDefault: false,
        },
      ],
    });
  });

  it("creates a new signature integration", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($name: String!, $apiKey: String!) {
          createSignaturitIntegration(name: $name, apiKey: $apiKey) {
            name
            isDefault
            provider
            type
            environment
          }
        }
      `,
      variables: {
        name: "My signature integration",
        apiKey: "<APIKEY>",
      },
    });

    expect(errors).toBeUndefined();
    expect(data?.createSignaturitIntegration).toEqual({
      name: "My signature integration",
      isDefault: false,
      provider: "SIGNATURIT",
      type: "SIGNATURE",
      environment: "DEMO",
    });
  });

  it("creates a new signature integration and sets it as default", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation ($name: String!, $apiKey: String!, $isDefault: Boolean) {
          createSignaturitIntegration(name: $name, apiKey: $apiKey, isDefault: $isDefault) {
            id
            name
            isDefault
            provider
            type
            environment
          }
        }
      `,
      variables: {
        name: "My signature integration",
        provider: "SIGNATURIT",
        apiKey: "<APIKEY>",
        isDefault: true,
      },
    });

    expect(errors).toBeUndefined();
    expect(omit(data?.createSignaturitIntegration, ["id"])).toEqual({
      name: "My signature integration",
      isDefault: true,
      provider: "SIGNATURIT",
      type: "SIGNATURE",
      environment: "DEMO",
    });

    // also check that the other signature integrations is_default is set to false
    const signatureIntegrations = await mocks.knex
      .from<OrgIntegration>("org_integration")
      .where({ org_id: organization.id, is_enabled: true, deleted_at: null, type: "SIGNATURE" })
      .orderBy("created_at", "desc")
      .select("id", "is_default");

    const defaultSignatureIntegration = signatureIntegrations.filter((i) => i.is_default);
    expect(defaultSignatureIntegration).toEqual([
      {
        id: fromGlobalId(data!.createSignaturitIntegration.id, "OrgIntegration").id,
        is_default: true,
      },
    ]);
  });

  it("marks a signature integration as default and unchecks all others", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!) {
          markSignatureIntegrationAsDefault(id: $id) {
            id
            isDefault
          }
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[1].id),
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.markSignatureIntegrationAsDefault).toEqual({
      id: toGlobalId("OrgIntegration", integrations[1].id),
      isDefault: true,
    });

    // also check that the other signature integrations is_default is set to false
    const signatureIntegrations = await mocks.knex
      .from<OrgIntegration>("org_integration")
      .where({ org_id: organization.id, deleted_at: null, type: "SIGNATURE" })
      .orderBy("created_at", "desc")
      .select("id", "is_default");

    const defaultSignatureIntegration = signatureIntegrations.filter((i) => i.is_default);
    expect(defaultSignatureIntegration).toEqual([
      {
        id: fromGlobalId(data!.markSignatureIntegrationAsDefault.id, "OrgIntegration").id,
        is_default: true,
      },
    ]);
  });

  it("throws error if trying to set as default an integration with type !== SIGNATURE", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!) {
          markSignatureIntegrationAsDefault(id: $id) {
            id
          }
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[0].id),
      },
    });

    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("throws error if trying to delete an integration with type !== SIGNATURE", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!) {
          deleteSignatureIntegration(id: $id)
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[0].id),
      },
    });

    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("throws error if trying to delete a signature integration with pending signature requests", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!) {
          deleteSignatureIntegration(id: $id)
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[1].id),
      },
    });

    expect(errors).toContainGraphQLError("SIGNATURE_INTEGRATION_IN_USE_ERROR");
    expect(data).toBeNull();
  });

  it("deletes the signature integration and cancels pending signature requests when passing force arg", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!) {
          deleteSignatureIntegration(id: $id, force: true)
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[1].id),
      },
    });

    expect(errors).toBeUndefined();
    expect(data!.deleteSignatureIntegration).toEqual("SUCCESS");

    const request = await mocks.knex
      .from("petition_signature_request")
      .where({ id: signatureRequest.id })
      .select("status");

    expect(request).toEqual([{ status: "CANCELLED" }]);
  });

  it("throws error if a normal user tries to create an integration", async () => {
    const { errors, data } = await testClient.withApiKey(normalUserApiKey).mutate({
      mutation: gql`
        mutation ($name: String!, $apiKey: String!, $isDefault: Boolean) {
          createSignaturitIntegration(name: $name, apiKey: $apiKey, isDefault: $isDefault) {
            id
          }
        }
      `,
      variables: {
        name: "My signature integration",
        provider: "SIGNATURIT",
        apiKey: "<APIKEY>",
        isDefault: true,
      },
    });

    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("throws error if a normal user tries to delete an integration", async () => {
    const { errors, data } = await testClient.withApiKey(normalUserApiKey).mutate({
      mutation: gql`
        mutation ($id: GID!) {
          deleteSignatureIntegration(id: $id, force: true)
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[2].id),
      },
    });

    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("throws error if a normal user tries to mark an integration as default", async () => {
    const { errors, data } = await testClient.withApiKey(normalUserApiKey).mutate({
      mutation: gql`
        mutation ($id: GID!) {
          markSignatureIntegrationAsDefault(id: $id) {
            id
          }
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[2].id),
      },
    });
    expect(errors).toContainGraphQLError("FORBIDDEN");
    expect(data).toBeNull();
  });

  it("deletes a signature integration", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation ($id: GID!) {
          deleteSignatureIntegration(id: $id)
        }
      `,
      variables: {
        id: toGlobalId("OrgIntegration", integrations[2].id),
      },
    });

    expect(errors).toBeUndefined();
    expect(data?.deleteSignatureIntegration).toEqual("SUCCESS");
  });
});
