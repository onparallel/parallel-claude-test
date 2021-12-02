import { Container } from "inversify";
import { Knex } from "knex";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Organization, User } from "../../__types";
import { FeatureFlagRepository } from "../FeatureFlagRepository";
import { Mocks } from "./mocks";

describe("repositories/FeatureFlagRepository", () => {
  let container: Container;
  let knex: Knex;
  let ff: FeatureFlagRepository;

  let org: Organization;
  let user1: User;
  let user2: User;

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    ff = container.get(FeatureFlagRepository);

    const mocks = new Mocks(knex);
    await mocks.createFeatureFlags([{ name: "PETITION_SIGNATURE", default_value: false }]);
    [org] = await mocks.createRandomOrganizations(1);
    [user1, user2] = await mocks.createRandomUsers(org.id, 2);
  });

  beforeEach(async () => {
    await knex.from("feature_flag_override").delete();
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  test("returns the default value when there's no overrides", async () => {
    const result = await ff.userHasFeatureFlag(user1.id, "PETITION_SIGNATURE", {
      refresh: true,
    });
    expect(result).toBe(false);
  });

  test("returns the org overridden value", async () => {
    await knex.into("feature_flag_override").insert([
      {
        feature_flag_name: "PETITION_SIGNATURE",
        org_id: org.id,
        value: true,
      },
    ]);
    const result = await ff.userHasFeatureFlag(user1.id, "PETITION_SIGNATURE", {
      refresh: true,
    });
    expect(result).toBe(true);
  });

  test("returns the user overridden value", async () => {
    await knex.into("feature_flag_override").insert([
      {
        feature_flag_name: "PETITION_SIGNATURE",
        org_id: org.id,
        value: true,
      },
      {
        feature_flag_name: "PETITION_SIGNATURE",
        user_id: user1.id,
        value: false,
      },
    ]);
    const [result1, result2] = await Promise.all([
      ff.userHasFeatureFlag(user1.id, "PETITION_SIGNATURE", {
        refresh: true,
      }),
      ff.userHasFeatureFlag(user2.id, "PETITION_SIGNATURE", {
        refresh: true,
      }),
    ]);

    expect(result1).toBe(false);
    expect(result2).toBe(true);
  });

  test("returns false for unknown userId", async () => {
    const result = await ff.userHasFeatureFlag(654321, "PETITION_SIGNATURE", {
      refresh: true,
    });
    expect(result).toBe(false);
  });
});
