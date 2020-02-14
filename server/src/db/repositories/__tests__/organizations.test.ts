import { Container } from "inversify";
import { createContainer } from "../../../container";
import { OrganizationReposistory } from "../organizations";
import { KNEX } from "../../knex";
import Knex from "knex";
import { deleteAllData } from "../../../util/knexUtils";
import {
  CreateOrganization,
  Organization,
  CreateUser,
  User
} from "../../__types";
import { range } from "remeda";
import uuid from "uuid";

describe("repositories/OrganizationReposistory", () => {
  let container: Container;
  let knex: Knex;
  let organizations: OrganizationReposistory;

  beforeAll(() => {
    container = createContainer();
    knex = container.get(KNEX);
    organizations = container.get(OrganizationReposistory);
  });

  afterAll(async () => {
    await knex.destroy();
  });

  describe("loadOrgUsers", () => {
    let org1: Organization, org2: Organization, org3: Organization;
    beforeAll(async () => {
      await deleteAllData(knex);
      const orgs: CreateOrganization[] = range(0, 3).map(i => ({
        name: `Org${i}`,
        identifier: `org${i}`,
        status: "DEV"
      }));
      [org1, org2, org3] = await knex<Organization>("organization")
        .insert(orgs)
        .returning("*");
      const users: CreateUser[] = [
        ...range(0, 42).map(i => ({
          org_id: org1.id,
          cognito_id: uuid.v4(),
          email: `user${i}@${org1.identifier}.com`
        })),
        ...range(0, 10).map(i => ({
          // 5 deleted users and 5 non-deleted users
          org_id: org2.id,
          cognito_id: uuid.v4(),
          email: `user${i}@${org2.identifier}.com`,
          // delete even i
          deleted_at: i % 2 === 0 ? new Date(2000, 1, 1) : null
        }))
      ];
      await knex<User>("user")
        .insert(users)
        .returning("*");
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
        range(0, 10).map(i => ({ email: `user${i}@${org1.identifier}.com` }))
      );
    });

    test("returns the second page of users", async () => {
      const result = await organizations.loadOrgUsers(org1.id, {
        limit: 10,
        offset: 10
      });
      expect(result.totalCount).toBe(42);
      expect(result.items).toMatchObject(
        range(10, 20).map(i => ({ email: `user${i}@${org1.identifier}.com` }))
      );
    });

    test("returns the right amount of non-deleted users", async () => {
      const result = await organizations.loadOrgUsers(org2.id, { limit: 10 });
      expect(result.totalCount).toBe(5);
      expect(result.items).toMatchObject(
        range(0, 10)
          .filter(i => i % 2 !== 0)
          .map(i => ({ email: `user${i}@${org2.identifier}.com` }))
      );
    });

    test("returns empty for an org without users", async () => {
      const result = await organizations.loadOrgUsers(org3.id, { limit: 10 });
      expect(result.totalCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });
});
