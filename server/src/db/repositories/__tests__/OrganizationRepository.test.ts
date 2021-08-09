import { Container } from "inversify";
import { Knex } from "knex";
import { deleteAllData } from "../../../util/knexUtils";
import { KNEX } from "../../knex";
import { Organization, User } from "../../__types";
import { OrganizationRepository } from "../OrganizationRepository";
import { Mocks } from "./mocks";
import { pick } from "remeda";
import * as faker from "faker";
import { createTestContainer } from "../../../../test/testContainer";

describe("repositories/OrganizationRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let organizations: OrganizationRepository;

  beforeAll(() => {
    container = createTestContainer();
    knex = container.get(KNEX);
    mocks = new Mocks(knex);
    organizations = container.get(OrganizationRepository);
  });

  afterAll(async () => {
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
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            email: faker.internet.email(),
          };
      }
    }

    beforeAll(async () => {
      await deleteAllData(knex);
      [org1, org2, org3] = await mocks.createRandomOrganizations(3);
      org1Users = await mocks.createRandomUsers(org1.id, 42);
      org2Users = await mocks.createRandomUsers(org2.id, 10, (i) => ({
        // sets info to search later
        ...setData(i),
        // delete even i
        deleted_at: i % 2 === 0 ? new Date(2000, 1, 1) : null,
      }));
    });

    test("returns an empty page without options", async () => {
      const result = await organizations.loadOrgUsers(org1.id, {});
      expect(result.totalCount).toBe(42);
      expect(result.items).toHaveLength(0);
    });

    test("returns the first page of users", async () => {
      const result = await organizations.loadOrgUsers(org1.id, { limit: 10 });
      expect(result.totalCount).toBe(42);
      expect(result.items).toMatchObject(
        // First 10 users created on the client
        org1Users.slice(0, 10).map(pick(["id"]))
      );
    });

    test("returns the second page of users", async () => {
      const result = await organizations.loadOrgUsers(org1.id, {
        limit: 10,
        offset: 10,
      });
      expect(result.totalCount).toBe(42);
      expect(result.items).toMatchObject(org1Users.slice(10, 20).map(pick(["id"])));
    });

    test("returns the right amount of non-deleted users", async () => {
      const result = await organizations.loadOrgUsers(org2.id, { limit: 10 });
      expect(result.totalCount).toBe(5);
      expect(result.items).toMatchObject(org2Users.filter((_, i) => i % 2 !== 0).map(pick(["id"])));
    });

    test("returns empty for an org without users", async () => {
      const result = await organizations.loadOrgUsers(org3.id, { limit: 10 });
      expect(result.totalCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    test("filters results by first name", async () => {
      const result = await organizations.loadOrgUsers(org2.id, {
        limit: 10,
        search: "Joffr",
      });

      expect(result.totalCount).toBe(1);
      expect(result.items).toMatchObject([usersToSearch[0]]);
    });

    test("filters results by full name", async () => {
      const result = await organizations.loadOrgUsers(org2.id, {
        limit: 10,
        search: "Joffrey Barath",
      });

      expect(result.totalCount).toBe(1);
      expect(result.items).toMatchObject([usersToSearch[0]]);
    });

    test("filters results by email", async () => {
      const result = await organizations.loadOrgUsers(org2.id, {
        limit: 10,
        search: "kingslanding.com",
      });

      expect(result.totalCount).toBe(2);
      expect(result.items).toMatchObject(usersToSearch);
    });
  });
});
