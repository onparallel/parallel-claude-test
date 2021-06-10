import gql from "graphql-tag";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  FeatureFlagOverride,
  Organization,
  User,
  UserAuthenticationToken,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { deleteAllData } from "../../util/knexUtils";
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
    await deleteAllData(knex);

    [organization] = await mocks.createRandomOrganizations(1);
    await mocks.createFeatureFlags([
      { name: "API_TOKENS", default_value: false },
    ]);
    await knex.from<FeatureFlagOverride>("feature_flag_override").insert({
      org_id: organization.id,
      feature_flag_name: "API_TOKENS",
      value: true,
    });

    // logged user
    [user] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
    }));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("Queries", () => {
    let authTokens: UserAuthenticationToken[];
    beforeEach(async () => {
      authTokens = [
        await mocks
          .createUserAuthToken("My First Token", user.id)
          .then((t) => t[0]),
        await mocks
          .createUserAuthToken("My Second Token", user.id)
          .then((t) => t[0]),
        await mocks
          .createUserAuthToken("My Third Token", user.id)
          .then((t) => t[0]),
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
              authenticationTokens(
                limit: 10
                offset: 0
                sortBy: createdAt_DESC
              ) {
                totalCount
                items {
                  tokenName
                }
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.me).toEqual({
        authenticationTokens: {
          totalCount: 3,
          items: [
            { tokenName: "My Third Token" },
            { tokenName: "My Second Token" },
            { tokenName: "My First Token" },
          ],
        },
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
          authTokenIds: [
            toGlobalId("UserAuthenticationToken", authTokens[1].id),
          ],
        },
      });

      const { errors, data } = await testClient.query({
        query: gql`
          query me {
            me {
              authenticationTokens(
                limit: 10
                offset: 0
                sortBy: createdAt_DESC
              ) {
                totalCount
                items {
                  tokenName
                }
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.me).toEqual({
        authenticationTokens: {
          totalCount: 2,
          items: [
            { tokenName: "My Third Token" },
            { tokenName: "My First Token" },
          ],
        },
      });
    });
  });

  describe("generateUserAuthToken", () => {
    beforeEach(async () => {
      await mocks.createUserAuthToken("My First Token", user.id);
    });

    afterEach(async () => {
      await mocks.clearUserAuthTokens();
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
      [userAuthToken] = await mocks.createUserAuthToken(
        "My First Token",
        user.id
      );

      [anotherUser] = await mocks.createRandomUsers(organization.id, 1);
      [anotherUserToken] = await mocks.createUserAuthToken(
        "Another Token",
        anotherUser.id
      );
    });

    afterEach(async () => {
      await mocks.clearUserAuthTokens();
    });

    it("revokes a token by its id", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation revokeUserAuthToken($authTokenIds: [GID!]!) {
            revokeUserAuthToken(authTokenIds: $authTokenIds)
          }
        `,
        variables: {
          authTokenIds: [
            toGlobalId("UserAuthenticationToken", userAuthToken.id),
          ],
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
          authTokenIds: [
            toGlobalId("UserAuthenticationToken", anotherUserToken.id),
          ],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
