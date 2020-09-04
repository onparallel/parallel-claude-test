import { initServer } from "./server";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, User } from "../../db/__types";
import { userCognitoId } from "./mocks";
import { toGlobalId } from "../../util/globalId";
import { TestClient, QueryRunner } from "./QueryRunner";

describe("GraphQL/Users", () => {
  let testClient: TestClient;
  let queryRunner: QueryRunner;
  let organization: Organization;
  let sessionUser: User;
  let userGID: string;

  beforeAll(async (done) => {
    testClient = initServer();
    queryRunner = new QueryRunner(testClient);
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
    const { errors, data } = await queryRunner.me();
    expect(errors).toBeUndefined();
    expect(data!.me).toMatchObject({
      id: userGID,
      fullName: "Harvey Specter",
      organization: {
        identifier: "parallel",
      },
    });
  });

  it("changes user name", async () => {
    const { errors, data } = await queryRunner.updateUser({
      userId: userGID,
      firstName: "Mike",
      lastName: "Ross",
    });

    expect(errors).toBeUndefined();
    expect(data!.updateUser).toMatchObject({
      id: userGID,
      fullName: "Mike Ross",
    });
  });
});
