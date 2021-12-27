import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../test/testContainer";
import { ApiContext } from "../../context";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, User } from "../../db/__types";
import { deleteAllData } from "../knexUtils";
import { getRequiredPetitionSendCredits } from "./../organizationUsageLimits";

describe("organizationUsageLimits", () => {
  let container: Container;
  let ctx: ApiContext;
  let knex: Knex;
  let mocks: Mocks;

  let organization: Organization;
  let user: User;

  beforeAll(async () => {
    container = createTestContainer();
    ctx = container.get<ApiContext>(ApiContext);
    knex = container.get(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  it("completing a petition as user should require 1 credit", async () => {
    const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    expect(await getRequiredPetitionSendCredits(petition.id, 1, ctx)).toEqual(1);
  });

  it("sending an already completed petition to a contact should not require credits", async () => {
    const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
      credits_used: 1, // a petition with credits_used = 1 to simulate it being completed by the user
    }));
    expect(await getRequiredPetitionSendCredits(petition.id, 1, ctx)).toEqual(0);
  });

  it("completing a petition as user and then doing a bulk send should require as much credits as the number of groups minus 1", async () => {
    const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1, () => ({
      credits_used: 1, // a petition with credits_used = 1 to simulate it being completed by the user
    }));
    expect(await getRequiredPetitionSendCredits(petition.id, 5, ctx)).toEqual(4); // 5 groups, the original petition is already counted so we only need 4 credits
  });

  it("doing a bulk send should require as much credits as the number of groups", async () => {
    const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    expect(await getRequiredPetitionSendCredits(petition.id, 5, ctx)).toEqual(5);
  });
});
