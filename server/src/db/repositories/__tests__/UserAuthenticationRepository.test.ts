import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { hash } from "../../../util/token";
import { KNEX } from "../../knex";
import { User, UserAuthenticationToken } from "../../__types";
import { UserAuthenticationRepository } from "../UserAuthenticationRepository";
import { Mocks } from "./mocks";

describe("repositories/UserAuthenticationRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let userAuth: UserAuthenticationRepository;
  let user: User;
  let authTokens: UserAuthenticationToken[];

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);
    userAuth = container.get(UserAuthenticationRepository);

    ({ user } = await mocks.createSessionUserAndOrganization());
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  beforeEach(async () => {
    // run in series to ensure default order
    authTokens = [
      (await userAuth.createUserAuthenticationToken("My Token 1", user)).userAuthToken,
      (await userAuth.createUserAuthenticationToken("My Token 2", user)).userAuthToken,
    ];
    userAuth.loadUserAuthenticationTokens.dataloader.clearAll();
  });

  afterEach(async () => {
    await knex.from("user_authentication_token").delete();
  });

  it("creates an auth token and returns its API key", async () => {
    const { userAuthToken, apiKey } = await userAuth.createUserAuthenticationToken(
      "My Token",
      user
    );

    expect(userAuthToken).toBeDefined();
    expect(userAuthToken.token_name).toEqual("My Token");
    expect(userAuthToken.user_id).toEqual(user.id);
    expect(userAuthToken.token_hash).toEqual(await hash(apiKey, ""));
  });

  it("loads all available user auth tokens", async () => {
    const userTokens = await userAuth.loadUserAuthenticationTokens(user.id);
    expect(userTokens).toEqual(authTokens);
  });

  it("deletes an user auth token by its id", async () => {
    const [deletedToken] = await userAuth.deleteUserAuthenticationTokens([authTokens[0].id], user);

    const availableTokens = await userAuth.loadUserAuthenticationTokens(user.id);

    expect(deletedToken.id).toEqual(authTokens[0].id);
    expect(availableTokens).toEqual([authTokens[1]]);
  });

  it("should throw error when trying to create a token with a taken name", async () => {
    expect.assertions(1);
    await expect(userAuth.createUserAuthenticationToken("My Token 1", user)).rejects.toBeDefined();
  });
});
