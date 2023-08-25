import { randomUUID } from "crypto";
import { Container } from "inversify";
import { Knex } from "knex";
import { difference } from "remeda";
import { createTestContainer } from "../../../../test/testContainer";
import { deleteAllData } from "../../../util/knexUtils";
import {
  Organization,
  User,
  UserGroupPermissionName,
  UserGroupPermissionNameValues,
} from "../../__types";
import { KNEX } from "../../knex";
import { UserRepository } from "../UserRepository";
import { Mocks } from "./mocks";

describe("UserRepository", () => {
  let container: Container;
  let knex: Knex;
  let mocks: Mocks;
  let usersRepo: UserRepository;
  let owner: User;
  let user: User;
  let organization: Organization;

  beforeAll(async () => {
    container = createTestContainer();
    knex = container.get<Knex>(KNEX);
    usersRepo = container.get(UserRepository);
    mocks = new Mocks(knex);
  });

  afterAll(async () => {
    await deleteAllData(knex);
    await knex.destroy();
  });

  beforeEach(async () => {
    // create new org each time to reset user groups
    [organization] = await mocks.createRandomOrganizations(1, () => ({
      name: "Parallel",
      status: "DEV",
    }));
    [owner] = await mocks.createRandomUsers(
      organization.id,
      1,
      () => ({
        is_org_owner: true,
      }),
      () => ({ cognito_id: randomUUID(), first_name: "Harvey", last_name: "Specter" }),
    );
    [user] = await mocks.createRandomUsers(organization.id);
  });

  describe("loadUserPermissions", () => {
    it("organization owner should always have all permissions", async () => {
      // create a "DENY ALL" user group, insert owner as member
      const [denyAllGroup] = await mocks.createUserGroups(
        1,
        organization.id,
        UserGroupPermissionNameValues.map((name) => ({
          name,
          effect: "DENY",
        })),
      );
      await mocks.insertUserGroupMembers(denyAllGroup.id, [owner.id]);

      const permissions = await usersRepo.loadUserPermissions(owner.id);
      expect(permissions).toEqual(difference(UserGroupPermissionNameValues, ["SUPERADMIN"]));
    });

    it("any user in the org should have these permissions", async () => {
      const permissions = await usersRepo.loadUserPermissions(user.id);
      expect(permissions).toEqual([
        "PETITIONS:CHANGE_PATH",
        "PETITIONS:CREATE_TEMPLATES",
        "INTEGRATIONS:CRUD_API",
        "PROFILES:SUBSCRIBE_PROFILES",
        "PETITIONS:CREATE_PETITIONS",
        "PROFILES:CREATE_PROFILES",
        "PROFILES:CLOSE_PROFILES",
        "PROFILES:LIST_PROFILES",
        "PROFILE_ALERTS:LIST_ALERTS",
        "CONTACTS:LIST_CONTACTS",
        "USERS:LIST_USERS",
        "TEAMS:LIST_TEAMS",
      ]);
    });

    it("user should be denied PROFILES permissions", async () => {
      const [denyProfilesGroup] = await mocks.createUserGroups(
        1,
        organization.id,
        [
          "PROFILES:DELETE_PROFILES",
          "PROFILES:DELETE_PERMANENTLY_PROFILES",
          "PROFILE_TYPES:CRUD_PROFILE_TYPES",
          "PROFILES:SUBSCRIBE_PROFILES",
          "PROFILES:CREATE_PROFILES",
          "PROFILES:CLOSE_PROFILES",
          "PROFILES:LIST_PROFILES",
          "PROFILE_ALERTS:LIST_ALERTS",
        ].map((name) => ({
          name: name as UserGroupPermissionName,
          effect: "DENY",
        })),
      );
      await mocks.insertUserGroupMembers(denyProfilesGroup.id, [user.id]);

      const permissions = await usersRepo.loadUserPermissions(user.id);
      expect(permissions).toEqual([
        "PETITIONS:CHANGE_PATH",
        "PETITIONS:CREATE_TEMPLATES",
        "INTEGRATIONS:CRUD_API",
        "PETITIONS:CREATE_PETITIONS",
        "CONTACTS:LIST_CONTACTS",
        "USERS:LIST_USERS",
        "TEAMS:LIST_TEAMS",
      ]);
    });

    it("DENY effect should take precedence over GRANT", async () => {
      const [denyGroup] = await mocks.createUserGroups(1, organization.id, {
        effect: "DENY",
        name: "ORG_SETTINGS",
      });
      const [allowGroup] = await mocks.createUserGroups(1, organization.id, {
        effect: "GRANT",
        name: "ORG_SETTINGS",
      });
      await mocks.insertUserGroupMembers(denyGroup.id, [user.id]);
      await mocks.insertUserGroupMembers(allowGroup.id, [user.id]);

      const permissions = await usersRepo.loadUserPermissions(user.id);
      expect(permissions).not.toContain("ORG_SETTINGS");
    });
  });

  describe("getUsersWithPermission", () => {
    it("should return users with PETITIONS:CREATE_PETITIONS permission", async () => {
      const users = await usersRepo.getUsersWithPermission(
        organization.id,
        "PETITIONS:CREATE_PETITIONS",
      );

      expect(users).toHaveLength(2);
      expect(users).toMatchObject([{ id: owner.id }, { id: user.id }]);
    });

    it("user should be denied PETITIONS:CREATE_PETITIONS permission", async () => {
      const [denyGroup] = await mocks.createUserGroups(1, organization.id, {
        effect: "DENY",
        name: "PETITIONS:CREATE_PETITIONS",
      });
      await mocks.insertUserGroupMembers(denyGroup.id, [user.id]);

      const users = await usersRepo.getUsersWithPermission(
        organization.id,
        "PETITIONS:CREATE_PETITIONS",
      );

      expect(users).toHaveLength(1);
      expect(users).toMatchObject([{ id: owner.id }]);
    });

    it("should return users with ORG_SETTINGS permission", async () => {
      const users = await usersRepo.getUsersWithPermission(organization.id, "ORG_SETTINGS");
      expect(users).toHaveLength(1);
      expect(users).toMatchObject([{ id: owner.id }]);
    });

    it("users should not have SUPERADMIN permission as they are not from ROOT org", async () => {
      const users = await usersRepo.getUsersWithPermission(organization.id, "SUPERADMIN");
      expect(users).toHaveLength(0);
    });

    it("should return only owner of ROOT organization", async () => {
      const [rootOrg] = await mocks.createRandomOrganizations(1, () => ({ status: "ROOT" }));
      const [rootOrgOwner] = await mocks.createRandomUsers(
        rootOrg.id,
        1,
        () => ({
          is_org_owner: true,
        }),
        () => ({ cognito_id: randomUUID(), first_name: "Mike", last_name: "Specter" }),
      );
      await mocks.createRandomUsers(rootOrg.id);

      const users = await usersRepo.getUsersWithPermission(rootOrg.id, "SUPERADMIN");
      expect(users).toHaveLength(1);
      expect(users).toMatchObject([{ id: rootOrgOwner.id }]);
    });
  });
});
