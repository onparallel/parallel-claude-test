import { faker } from "@faker-js/faker";
import { Container } from "inversify";
import { Knex } from "knex";
import { pick } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import { Organization, User } from "../../__types";
import { KNEX } from "../../knex";
import { OrganizationRepository } from "../OrganizationRepository";
import { Mocks } from "./mocks";

describe("repositories/OrganizationRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let organizations: OrganizationRepository;

  beforeAll(async () => {
    container = await createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);
    organizations = container.get(OrganizationRepository);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  describe("loadOrgUsers", () => {
    let org1: Organization, org2: Organization, org3: Organization;
    let org1Users: User[], org2Users: User[];
    const usersToSearch = [
      {
        first_name: "Joffrey",
        last_name: "Baratheon",
        email: "joffrey@kingslanding.com",
      },
      {
        first_name: "Robert",
        last_name: "Baratheon",
        email: "robert.the.king@kingslanding.com",
      },
    ];

    function setData(index: number) {
      switch (index) {
        case 5:
          return {
            first_name: usersToSearch[0].first_name,
            last_name: usersToSearch[0].last_name,
            email: usersToSearch[0].email,
          };
        case 7:
          return {
            first_name: usersToSearch[1].first_name,
            last_name: usersToSearch[1].last_name,
            email: usersToSearch[1].email,
          };
        default:
          return {
            first_name: faker.person.firstName(),
            last_name: faker.person.lastName(),
            email: faker.internet.email({ provider: "onparallel.com" }),
          };
      }
    }

    beforeAll(async () => {
      [org1, org2, org3] = await mocks.createRandomOrganizations(3);
      org1Users = await mocks.createRandomUsers(org1.id, 42);
      org2Users = await mocks.createRandomUsers(
        org2.id,
        10,
        (i) => ({
          deleted_at: i % 2 === 0 ? new Date(2000, 1, 1) : null,
        }),
        (i) => ({
          // sets info to search later
          ...setData(i),
          // delete even i
          deleted_at: i % 2 === 0 ? new Date(2000, 1, 1) : null,
        }),
      );
    });

    test("returns an empty page without options", async () => {
      const result = organizations.getPaginatedUsersForOrg(org1.id, {});
      expect(await result.totalCount).toBe(42);
      expect(await result.items).toHaveLength(0);
    });

    test("returns the first page of users", async () => {
      const result = organizations.getPaginatedUsersForOrg(org1.id, { limit: 10 });
      expect(await result.totalCount).toBe(42);
      expect(await result.items).toMatchObject(
        // First 10 users created on the client
        org1Users.slice(0, 10).map(pick(["id"])),
      );
    });

    test("returns the second page of users", async () => {
      const result = organizations.getPaginatedUsersForOrg(org1.id, {
        limit: 10,
        offset: 10,
      });
      expect(await result.totalCount).toBe(42);
      expect(await result.items).toMatchObject(org1Users.slice(10, 20).map(pick(["id"])));
    });

    test("returns the right amount of non-deleted users", async () => {
      const result = organizations.getPaginatedUsersForOrg(org2.id, { limit: 10 });
      expect(await result.totalCount).toBe(5);
      expect(await result.items).toMatchObject(
        org2Users.filter((_, i) => i % 2 !== 0).map(pick(["id"])),
      );
    });

    test("returns empty for an org without users", async () => {
      const result = organizations.getPaginatedUsersForOrg(org3.id, { limit: 10 });
      expect(await result.totalCount).toBe(0);
      expect(await result.items).toHaveLength(0);
    });

    test("filters results by first name", async () => {
      const [userData] = await mocks
        .knex("user_data")
        .where("email", "joffrey@kingslanding.com")
        .select("*");

      const result = organizations.getPaginatedUsersForOrg(org2.id, {
        limit: 10,
        search: "Joffr",
      });

      expect(await result.totalCount).toBe(1);
      expect(await result.items).toMatchObject([
        {
          user_data_id: userData.id,
          org_id: org2.id,
          is_org_owner: false,
        },
      ]);
    });

    test("filters results by full name", async () => {
      const [userData] = await mocks
        .knex("user_data")
        .where("email", "joffrey@kingslanding.com")
        .select("*");

      const result = organizations.getPaginatedUsersForOrg(org2.id, {
        limit: 10,
        search: "Joffrey Barath",
      });

      expect(await result.totalCount).toBe(1);
      expect(await result.items).toMatchObject([
        {
          user_data_id: userData.id,
          org_id: org2.id,
          is_org_owner: false,
        },
      ]);
    });

    test("filters results by email", async () => {
      const userData = await mocks
        .knex("user_data")
        .whereRaw(`"email" like '%@kingslanding.com'`)
        .select("*");

      const result = organizations.getPaginatedUsersForOrg(org2.id, {
        limit: 10,
        search: "kingslanding.com",
      });

      expect(await result.totalCount).toBe(2);
      expect(await result.items).toMatchObject([
        {
          user_data_id: userData.find((ud) => ud.email === "joffrey@kingslanding.com")!.id,
          org_id: org2.id,
          is_org_owner: false,
        },
        {
          user_data_id: userData.find((ud) => ud.email === "robert.the.king@kingslanding.com")!.id,
          org_id: org2.id,
          is_org_owner: false,
        },
      ]);
    });
  });
});
