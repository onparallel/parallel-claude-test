import { gql } from "@apollo/client";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { FeatureFlagOverride, Organization, User, UserAuthenticationToken } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/UserAuthenticationToken", () => {
  let testClient: TestClient;
  let user: User;
  let organization: Organization;
  let mocks: Mocks;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([{ name: "DEVELOPER_ACCESS", default_value: false }]);
    await knex.from<FeatureFlagOverride>("feature_flag_override").insert({
      org_id: organization.id,
      feature_flag_name: "DEVELOPER_ACCESS",
      value: true,
    });
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("Queries", () => {
    let authTokens: UserAuthenticationToken[];
    beforeEach(async () => {
      authTokens = [
        await mocks.createUserAuthToken("My First Token", user.id).then(({ auth }) => auth),
        await mocks.createUserAuthToken("My Second Token", user.id).then(({ auth }) => auth),
        await mocks.createUserAuthToken("My Third Token", user.id).then(({ auth }) => auth),
      ];
    });

    afterEach(async () => {
      await mocks.clearUserAuthTokens();
    });

    it("queries every auth token of the logged user", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query me {
            me {
              tokens {
                tokenName
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.me).toEqual({
        tokens: [
          { tokenName: "My First Token" },
          { tokenName: "My Second Token" },
          { tokenName: "My Third Token" },
        ],
      });
    });

    it("removes the token from the list after revoking it", async () => {
      await testClient.mutate({
        mutation: gql`
          mutation revokeUserAuthToken($authTokenIds: [GID!]!) {
            revokeUserAuthToken(authTokenIds: $authTokenIds)
          }
        `,
        variables: {
          authTokenIds: [toGlobalId("UserAuthenticationToken", authTokens[1].id)],
        },
      });

      const { errors, data } = await testClient.query({
        query: gql`
          query me {
            me {
              tokens {
                tokenName
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.me).toEqual({
        tokens: [{ tokenName: "My First Token" }, { tokenName: "My Third Token" }],
      });
    });
  });

  describe("generateUserAuthToken", () => {
    beforeEach(async () => {
      await mocks.clearUserAuthTokens();
      await mocks.createUserAuthToken("My First Token", user.id);
    });

    it("generates a new auth token and returns its API key", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation generateUserAuthToken($tokenName: String!) {
            generateUserAuthToken(tokenName: $tokenName) {
              apiKey
              userAuthToken {
                tokenName
              }
            }
          }
        `,
        variables: {
          tokenName: "My Second Token",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.generateUserAuthToken.userAuthToken).toEqual({
        tokenName: "My Second Token",
      });
      expect(data!.generateUserAuthToken.apiKey).toBeDefined();
    });

    it("sends error when generating a token with a taken name", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation generateUserAuthToken($tokenName: String!) {
            generateUserAuthToken(tokenName: $tokenName) {
              apiKey
              userAuthToken {
                tokenName
              }
            }
          }
        `,
        variables: {
          tokenName: "My First Token",
        },
      });

      expect(errors).toContainGraphQLError("UNIQUE_TOKEN_NAME_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("revokeUserAuthToken", () => {
    let userAuthToken: UserAuthenticationToken;
    let anotherUser: User;
    let anotherUserToken: UserAuthenticationToken;

    beforeEach(async () => {
      await mocks.clearUserAuthTokens();
      ({ auth: userAuthToken } = await mocks.createUserAuthToken("My First Token", user.id));

      [anotherUser] = await mocks.createRandomUsers(organization.id, 1);
      ({ auth: anotherUserToken } = await mocks.createUserAuthToken(
        "Another Token",
        anotherUser.id
      ));
    });

    it("revokes a token by its id", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation revokeUserAuthToken($authTokenIds: [GID!]!) {
            revokeUserAuthToken(authTokenIds: $authTokenIds)
          }
        `,
        variables: {
          authTokenIds: [toGlobalId("UserAuthenticationToken", userAuthToken.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.revokeUserAuthToken).toEqual("SUCCESS");
    });

    it("sends error when trying to revoke the token of another user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation revokeUserAuthToken($authTokenIds: [GID!]!) {
            revokeUserAuthToken(authTokenIds: $authTokenIds)
          }
        `,
        variables: {
          authTokenIds: [toGlobalId("UserAuthenticationToken", anotherUserToken.id)],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
