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

  it("fetches all organization enabled integrations ordered by created_at DESC", async () => {
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
      },
    ]);
  });
});
