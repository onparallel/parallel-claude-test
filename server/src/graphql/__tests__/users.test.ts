import { ApolloServerTestClient } from "apollo-server-testing";
import gql from "graphql-tag";
import { initServer } from "./server";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Container } from "inversify";
import Knex from "knex";
import { KNEX } from "../../db/knex";
import { Organization, User } from "../../db/__types";
import { userCognitoId } from "./mocks";
import { toGlobalId } from "../../util/globalId";

describe("GraphQL/Users", () => {
  let client: {
    query: ApolloServerTestClient["query"];
    mutate: ApolloServerTestClient["mutate"];
    stop: () => Promise<void>;
    container: Container;
  };
  let mocks: Mocks;
  let organization: Organization;
  let sessionUser: User;
  let userGID: string;

  beforeAll(async (done) => {
    client = initServer();
    mocks = new Mocks(client.container.get<Knex>(KNEX));
    [organization] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));

    [sessionUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: userCognitoId,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
    }));

    userGID = toGlobalId("User", sessionUser.id);
    done();
  });

  afterAll(async (done) => {
    await client.stop();
    done();
  });

  it("fetches session user", async () => {
    const res = await client.query({
      query: gql`
        query {
          me {
            id
            fullName
            organization {
              identifier
            }
          }
        }
      `,
    });
    expect(res.errors).toBeUndefined();
    expect(res.data).not.toBeNull();
    expect(res.data!.me).toMatchObject({
      id: userGID,
      fullName: "Harvey Specter",
      organization: {
        identifier: "parallel",
      },
    });
  });

  it("changes user name", async () => {
    const res = await client.mutate({
      mutation: gql`
        mutation updateUser(
          $userId: GID!
          $firstName: String
          $lastName: String
        ) {
          updateUser(
            id: $userId
            data: { firstName: $firstName, lastName: $lastName }
          ) {
            id
            fullName
          }
        }
      `,
      variables: {
        userId: userGID,
        firstName: "Mike",
        lastName: "Ross",
      },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data).not.toBeNull();
    expect(res.data!.updateUser).toMatchObject({
      id: userGID,
      fullName: "Mike Ross",
    });
  });
});
