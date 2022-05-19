import { gql } from "graphql-request";
import { Knex } from "knex";
import { indexBy } from "remeda";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, User, UserData } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Organization", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let organization: Organization;
  let user: User;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization("ADMIN"));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("organization", () => {
    let orgUsers: User[] = [];
    let userDataById: Record<string, UserData> = {};
    beforeAll(async () => {
      orgUsers = await mocks.createRandomUsers(organization.id, 10);
      userDataById = indexBy(
        await mocks
          .knex("user_data")
          .whereIn(
            "id",
            [user, ...orgUsers].map((u) => u.user_data_id)
          )
          .select("*"),
        (d) => d.id
      );
    });

    it("queries the organization with all the users in default order", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            organization(id: $id) {
              name
              status
              users(limit: 11, offset: 0) {
                totalCount
                items {
                  id
                  email
                  fullName
                }
              }
            }
          }
        `,
        { id: toGlobalId("Organization", organization.id) }
      );

      expect(errors).toBeUndefined();
      expect(data?.organization).toEqual({
        name: "Parallel",
        status: "DEV",
        users: {
          totalCount: 11,
          items: [user, ...orgUsers]
            .sort((a, b) => a.id - b.id)
            .map((u) => {
              const userData = userDataById[u.user_data_id];
              return {
                id: toGlobalId("User", u.id),
                email: userData.email,
                fullName: fullName(userData.first_name, userData.last_name),
              };
            }),
        },
      });
    });
  });

  describe("updateOrganizationAutoAnonymizePeriod", () => {
    let normalUser: User;
    let normalUserApiKey: string;
    beforeAll(async () => {
      [normalUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
        organization_role: "NORMAL",
      }));
      ({ apiKey: normalUserApiKey } = await mocks.createUserAuthToken(
        "normal-token",
        normalUser.id
      ));

      await mocks.createFeatureFlags([{ name: "AUTO_ANONYMIZE", default_value: true }]);
    });

    beforeEach(async () => {
      await mocks.updateFeatureFlag("AUTO_ANONYMIZE", true);
    });

    it("sends error if user doesn't have enabled feature_flag", async () => {
      await mocks.updateFeatureFlag("AUTO_ANONYMIZE", false);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfter {
                months
              }
            }
          }
        `,
        { months: 1 }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user is not admin", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfter {
                months
              }
            }
          }
        `,
        { months: 1 }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if period is invalid", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfter {
                months
              }
            }
          }
        `,
        { months: 0 }
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("updates auto-anonymize period of the user's organization", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($months: Int) {
            updateOrganizationAutoAnonymizePeriod(months: $months) {
              id
              anonymizePetitionsAfter {
                years
                months
              }
            }
          }
        `,
        { months: 25 }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateOrganizationAutoAnonymizePeriod).toEqual({
        id: toGlobalId("Organization", organization.id),
        anonymizePetitionsAfter: { years: 2, months: 1 },
      });
    });
  });
});
