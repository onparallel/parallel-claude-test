import { initServer, TestClient } from "./server";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, User } from "../../db/__types";
import { userCognitoId } from "./mocks";
import { toGlobalId } from "../../util/globalId";
import gql from "graphql-tag";

describe("GraphQL/Users", () => {
  let testClient: TestClient;
  let organization: Organization;
  let sessionUser: User;
  let userGID: string;

  beforeAll(async (done) => {
    testClient = initServer();
    const mocks = new Mocks(testClient.knex);
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
    await testClient.stop();
    done();
  });

  it("fetches session user", async () => {
    const { errors, data } = await testClient.query({
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
    expect(errors).toBeUndefined();
    expect(data!.me).toEqual({
      id: userGID,
      fullName: "Harvey Specter",
      organization: {
        identifier: "parallel",
      },
    });
  });

  it("changes user name", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation($userId: GID!, $firstName: String, $lastName: String) {
          updateUser(
            id: $userId
            data: { firstName: $firstName, lastName: $lastName }
          ) {
            id
            fullName
          }
        }
      `,
      variables: { userId: userGID, firstName: "Mike", lastName: "Ross" },
    });

    expect(errors).toBeUndefined();
    expect(data!.updateUser).toEqual({
      id: userGID,
      fullName: "Mike Ross",
    });
  });
});
