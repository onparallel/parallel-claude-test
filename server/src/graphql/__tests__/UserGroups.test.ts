import gql from "graphql-tag";
import { Knex } from "knex";
import { Organization, Petition, PetitionPermission, User, UserGroup } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

describe("GraphQL/UserGroups", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let organization: Organization;
  let sessionUser: User;

  let users: User[];
  let userGroups: UserGroup[];
  let allUsersGroup: UserGroup;
  let petition: Petition;
  let template: Petition;
  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization(() => ({
      status: "ROOT",
    })));

    [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
    [template] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1, () => ({
      is_template: true,
      status: null,
    }));
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
    await mocks.knex.from("petition_permission").delete();
    await mocks.knex.from("template_default_permission").delete();
    await mocks.knex.from("user_group_permission").delete();
    await mocks.knex.from("user_group_member").delete();
    await mocks.knex.from("user_group").delete();
    await mocks.knex.from("user_authentication_token").delete();
    await mocks.knex.from("user").where({ is_org_owner: false }).delete();

    [allUsersGroup] = await mocks.createUserGroups(
      1,
      organization.id,
      [
        { effect: "ALLOW", name: "PETITIONS:CHANGE_PATH" },
        { effect: "ALLOW", name: "PETITIONS:CREATE_PETITIONS" },
        { effect: "ALLOW", name: "PETITIONS:CREATE_TEMPLATES" },
      ],
      () => ({
        type: "ALL_USERS",
        name: "",
        localizable_name: { en: "All users", es: "Todos los usuarios" },
      }),
    );
    await mocks.insertUserGroupMembers(allUsersGroup.id, [sessionUser.id]);

    userGroups = await mocks.createUserGroups(3, organization.id, [], (i) => ({
      name: i === 0 ? "First Group" : i === 1 ? "Second Group" : "Third Group",
    }));

    users = await mocks.createRandomUsers(organization.id, 4);
    await mocks.insertUserGroupMembers(
      userGroups[0].id,
      users.slice(0, 3).map((user) => user.id),
    );

    await mocks.knex<PetitionPermission>("petition_permission").insert([
      {
        user_id: sessionUser.id,
        petition_id: petition.id,
        type: "OWNER",
      },
    ]);

    await mocks.sharePetitionWithGroups(petition.id, [userGroups[0].id]);
    await mocks.automaticShareTemplateWithGroups(template.id, [userGroups[0].id]);
  });

  describe("userGroups", () => {
    it("lists all available user groups in the org", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query UserGroups {
            userGroups(limit: 100, offset: 0) {
              totalCount
              items {
                id
                type
                members {
                  user {
                    id
                  }
                }
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.userGroups).toEqual({
        totalCount: 4,
        items: [
          {
            id: expect.any(String),
            type: "ALL_USERS",
            members: [
              { user: { id: toGlobalId("User", sessionUser.id) } },
              ...users.map((u) => ({
                user: { id: toGlobalId("User", u.id) },
              })),
            ],
          },
          ...userGroups.map((ug) => ({
            id: toGlobalId("UserGroup", ug.id),
            type: "NORMAL",
            members:
              ug.id === userGroups[0].id
                ? users.slice(0, 3).map((user) => ({
                    user: { id: toGlobalId("User", user.id) },
                  }))
                : [],
          })),
        ],
      });
    });

    it("lists all available user groups in the org sorted by name", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query UserGroups {
            userGroups(limit: 100, offset: 0, sortBy: name_ASC) {
              totalCount
              items {
                id
                type
              }
            }
          }
        `,
      });

      expect(errors).toBeUndefined();
      expect(data!.userGroups).toEqual({
        totalCount: 4,
        items: [
          { id: expect.any(String), type: "ALL_USERS" },
          ...userGroups
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((ug) => ({
              id: toGlobalId("UserGroup", ug.id),
              type: "NORMAL",
            })),
        ],
      });
    });

    it("searches for a user group by its name", async () => {
      const { data, errors } = await testClient.query({
        query: gql`
          query UserGroups($search: String) {
            userGroups(limit: 100, offset: 0, search: $search) {
              totalCount
              items {
                id
                members {
                  user {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          search: "Sec",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.userGroups).toEqual({
        totalCount: 1,
        items: [{ id: toGlobalId("UserGroup", userGroups[1].id), members: [] }],
      });
    });
  });

  describe("createUserGroup", () => {
    it("creates a new user group with no members", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_createUserGroup($name: String!) {
            createUserGroup(name: $name, userIds: []) {
              name
              members {
                id
              }
            }
          }
        `,
        variables: { name: "My New Group" },
      });

      expect(errors).toBeUndefined();
      expect(data!.createUserGroup).toEqual({
        name: "My New Group",
        members: [],
      });
    });

    it("can't create a group with name longer than 100 chars", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_createUserGroup($name: String!) {
            createUserGroup(name: $name, userIds: []) {
              name
              members {
                id
              }
            }
          }
        `,
        variables: { name: "x".repeat(101) },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("creates a new user group and assign users as members", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_createUserGroup($name: String!, $userIds: [GID!]!) {
            createUserGroup(name: $name, userIds: $userIds) {
              name
              members {
                user {
                  id
                }
              }
            }
          }
        `,
        variables: {
          name: "Marketing",
          userIds: users.slice(0, 2).map((m) => toGlobalId("User", m.id)),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.createUserGroup).toEqual({
        name: "Marketing",
        members: users.slice(0, 2).map((m) => ({ user: { id: toGlobalId("User", m.id) } })),
      });
    });
  });

  describe("updateUserGroup", () => {
    it("updates the name of a user group", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_updateUserGroup($groupId: GID!, $data: UpdateUserGroupInput!) {
            updateUserGroup(id: $groupId, data: $data) {
              id
              name
            }
          }
        `,
        variables: {
          groupId: toGlobalId("UserGroup", userGroups[2].id),
          data: { name: "new name" },
        },
      });
      expect(errors).toBeUndefined();
      expect(data!.updateUserGroup).toEqual({
        id: toGlobalId("UserGroup", userGroups[2].id),
        name: "new name",
      });
    });
  });

  describe("deleteUserGroup", () => {
    it("fails if trying to delete an INITIAL group without PERMISSION_MANAGEMENT feature flag", async () => {
      const [initialType] = await mocks.createUserGroups(1, organization.id, undefined, () => ({
        type: "INITIAL",
      }));

      const { data, errors } = await testClient.execute(
        gql`
          mutation UserGroups_deleteUserGroup($groupId: GID!) {
            deleteUserGroup(ids: [$groupId])
          }
        `,
        { groupId: toGlobalId("UserGroup", initialType.id) },
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("deletes a user group", async () => {
      const { data: deleteData, errors: deleteError } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_deleteUserGroup($groupId: GID!) {
            deleteUserGroup(ids: [$groupId])
          }
        `,
        variables: {
          groupId: toGlobalId("UserGroup", userGroups[2].id),
        },
      });
      expect(deleteError).toBeUndefined();
      expect(deleteData?.deleteUserGroup).toEqual("SUCCESS");

      const { data, errors } = await testClient.query({
        query: gql`
          query UserGroups {
            userGroups(limit: 100, offset: 0) {
              totalCount
              items {
                id
                type
              }
            }
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data?.userGroups).toEqual({
        totalCount: 3,
        items: [
          { id: expect.any(String), type: "ALL_USERS" },
          { id: toGlobalId("UserGroup", userGroups[0].id), type: "NORMAL" },
          { id: toGlobalId("UserGroup", userGroups[1].id), type: "NORMAL" },
        ],
      });
    });

    it("removes all group permissions when deleting a group", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_deleteUserGroup($groupId: GID!) {
            deleteUserGroup(ids: [$groupId])
          }
        `,
        variables: {
          groupId: toGlobalId("UserGroup", userGroups[0].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.deleteUserGroup).toEqual("SUCCESS");

      const groupPermissions = await mocks
        .knex<PetitionPermission>("petition_permission")
        .whereNull("deleted_by")
        .andWhere((q) =>
          q
            .where("from_user_group_id", userGroups[0].id)
            .orWhere("user_group_id", userGroups[0].id),
        );

      expect(groupPermissions).toHaveLength(0);
    });

    it("stops automatic sharing when deleting a group", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_deleteUserGroup($groupId: GID!) {
            deleteUserGroup(ids: [$groupId])
          }
        `,
        variables: {
          groupId: toGlobalId("UserGroup", userGroups[0].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.deleteUserGroup).toEqual("SUCCESS");

      const defaultPermissions = await mocks
        .knex<PetitionPermission>("template_default_permission")
        .whereNull("deleted_by")
        .where("user_group_id", userGroups[0].id);

      expect(defaultPermissions).toHaveLength(0);
    });
  });

  describe("addUsersToUserGroup", () => {
    it("add users as group members", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_addUsersToUserGroup($userGroupId: GID!, $userIds: [GID!]!) {
            addUsersToUserGroup(userIds: $userIds, userGroupId: $userGroupId) {
              id
              name
              members {
                user {
                  id
                }
              }
            }
          }
        `,
        variables: {
          userGroupId: toGlobalId("UserGroup", userGroups[1].id),
          userIds: [toGlobalId("User", users[0].id)],
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.addUsersToUserGroup).toEqual({
        id: toGlobalId("UserGroup", userGroups[1].id),
        name: userGroups[1].name,
        members: [{ user: { id: toGlobalId("User", users[0].id) } }],
      });
    });

    it("gives new group members permissions on group-shared petitions", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_addUsersToUserGroup($userGroupId: GID!, $userIds: [GID!]!) {
            addUsersToUserGroup(userIds: $userIds, userGroupId: $userGroupId) {
              id
              name
              members {
                user {
                  id
                }
              }
            }
          }
        `,
        variables: {
          userGroupId: toGlobalId("UserGroup", userGroups[0].id),
          userIds: [toGlobalId("User", users[3].id)],
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.addUsersToUserGroup).toEqual({
        id: toGlobalId("UserGroup", userGroups[0].id),
        name: userGroups[0].name,
        members: users.map((m) => ({
          user: { id: toGlobalId("User", m.id) },
        })),
      });

      const newMemberPermissions = await mocks
        .knex<PetitionPermission>("petition_permission")
        .whereNull("deleted_at")
        .where("user_id", users[3].id)
        .where("from_user_group_id", userGroups[0].id)
        .select("*");

      expect(newMemberPermissions).toHaveLength(1);
    });
  });

  describe("removeUsersFromGroup", () => {
    it("removes members from a group", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_removeUsersFromGroup($userGroupId: GID!, $userIds: [GID!]!) {
            removeUsersFromGroup(userIds: $userIds, userGroupId: $userGroupId) {
              id
              name
              members {
                user {
                  id
                }
              }
            }
          }
        `,
        variables: {
          userGroupId: toGlobalId("UserGroup", userGroups[0].id),
          userIds: [toGlobalId("User", users[0].id), toGlobalId("User", users[1].id)],
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.removeUsersFromGroup).toEqual({
        id: toGlobalId("UserGroup", userGroups[0].id),
        name: userGroups[0].name,
        members: [{ user: { id: toGlobalId("User", users[2].id) } }],
      });
    });

    it("users removed from a group lose permissions on the group-shared petitions", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_removeUsersFromGroup($userGroupId: GID!, $userIds: [GID!]!) {
            removeUsersFromGroup(userIds: $userIds, userGroupId: $userGroupId) {
              id
              name
              members {
                user {
                  id
                }
              }
            }
          }
        `,
        variables: {
          userGroupId: toGlobalId("UserGroup", userGroups[0].id),
          userIds: [toGlobalId("User", users[0].id), toGlobalId("User", users[1].id)],
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.removeUsersFromGroup).toEqual({
        id: toGlobalId("UserGroup", userGroups[0].id),
        name: userGroups[0].name,
        members: [{ user: { id: toGlobalId("User", users[2].id) } }],
      });

      const groupPermissions = await mocks
        .knex<PetitionPermission>("petition_permission")
        .whereNull("deleted_at")
        .where("from_user_group_id", userGroups[0].id)
        .select("*");

      expect(groupPermissions).toHaveLength(1);
      expect(groupPermissions[0].user_id).toBe(users[2].id);
    });
  });

  describe("cloneUserGroups", () => {
    it("clones a user group and all its members", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_cloneUserGroups($userGroupIds: [GID!]!, $locale: UserLocale!) {
            cloneUserGroups(userGroupIds: $userGroupIds, locale: $locale) {
              name
              members {
                user {
                  id
                }
              }
            }
          }
        `,
        variables: {
          userGroupIds: [toGlobalId("UserGroup", userGroups[0].id)],
          locale: "en",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.cloneUserGroups).toEqual([
        {
          name: userGroups[0].name.concat(" (copy)"),
          members: users.slice(0, 3).map((user) => ({ user: { id: toGlobalId("User", user.id) } })),
        },
      ]);
    });

    it("cloning a user group should not clone the group permissions", async () => {
      const { data, errors } = await testClient.mutate({
        mutation: gql`
          mutation UserGroups_cloneUserGroups($userGroupIds: [GID!]!, $locale: UserLocale!) {
            cloneUserGroups(userGroupIds: $userGroupIds, locale: $locale) {
              id
            }
          }
        `,
        variables: {
          userGroupIds: [toGlobalId("UserGroup", userGroups[0].id)],
          locale: "en",
        },
      });
      expect(errors).toBeUndefined();
      const newGroupId = fromGlobalId(data?.cloneUserGroups[0].id, "UserGroup").id;
      const newGroupPermissions = await mocks
        .knex<PetitionPermission>("petition_permission")
        .whereNull("deleted_at")
        .andWhere((q) =>
          q.where("user_group_id", newGroupId).orWhere("from_user_group_id", newGroupId),
        )
        .select("*");

      expect(newGroupPermissions).toHaveLength(0);
    });
  });

  describe("updateUserGroupPermissions", () => {
    beforeAll(async () => {
      await mocks.createFeatureFlags([{ name: "PERMISSION_MANAGEMENT", default_value: true }]);
    });

    it("fails if user doesn't have PERMISSION_MANAGEMENT feature flag", async () => {
      await mocks.updateFeatureFlag("PERMISSION_MANAGEMENT", false);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
              permissions {
                effect
                name
              }
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", allUsersGroup.id),
          permissions: [
            {
              effect: "ALLOW",
              name: "TAGS:CRUD_TAGS",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();

      await mocks.updateFeatureFlag("PERMISSION_MANAGEMENT", true);
    });

    it("fails when trying to give SUPERADMIN permission to an org that is not ROOT", async () => {
      const [org] = await mocks.createRandomOrganizations(1, () => ({ status: "DEV" }));
      const [user] = await mocks.createRandomUsers(org.id, 1, () => ({ is_org_owner: true }));
      const [userGroup] = await mocks.createUserGroups(1, org.id, [
        { name: "TEAMS:CRUD_PERMISSIONS", effect: "ALLOW" },
      ]);
      await mocks.insertUserGroupMembers(userGroup.id, [user.id]);
      const { apiKey } = await mocks.createUserAuthToken("token", user.id);

      const { errors, data } = await testClient.withApiKey(apiKey).execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", userGroup.id),
          permissions: [
            {
              effect: "ALLOW",
              name: "SUPERADMIN",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if user does not have TEAMS:CRUD_PERMISSIONS permission", async () => {
      const [user] = await mocks.createRandomUsers(organization.id);
      const { apiKey } = await mocks.createUserAuthToken("token", user.id);

      const { errors, data } = await testClient.withApiKey(apiKey).execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", userGroups[0].id),
          permissions: [
            {
              effect: "ALLOW",
              name: "ORG_SETTINGS",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if passing unknown permission", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", userGroups[0].id),
          permissions: [
            {
              effect: "ALLOW",
              name: "UNKNOWN_PERMISSION",
            },
          ],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if passing more than 1 effect on the same permission name", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
              permissions {
                effect
                name
              }
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", allUsersGroup.id),
          permissions: [
            { effect: "ALLOW", name: "TAGS:CRUD_TAGS" },
            { effect: "DENY", name: "TAGS:CRUD_TAGS" },
          ],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("allows a permission on a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
              permissions {
                effect
                name
              }
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", allUsersGroup.id),
          permissions: [
            {
              effect: "ALLOW",
              name: "TAGS:CRUD_TAGS",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateUserGroupPermissions).toMatchObject({
        id: toGlobalId("UserGroup", allUsersGroup.id),
        permissions: expect.toIncludeSameMembers([
          { effect: "ALLOW", name: "PETITIONS:CHANGE_PATH" },
          { effect: "ALLOW", name: "PETITIONS:CREATE_PETITIONS" },
          { effect: "ALLOW", name: "PETITIONS:CREATE_TEMPLATES" },
          { effect: "ALLOW", name: "TAGS:CRUD_TAGS" },
        ]),
      });
    });

    it("denies a permission on a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
              permissions {
                effect
                name
              }
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", allUsersGroup.id),
          permissions: [
            {
              effect: "DENY",
              name: "USERS:GHOST_LOGIN",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateUserGroupPermissions).toEqual({
        id: toGlobalId("UserGroup", allUsersGroup.id),
        permissions: expect.toIncludeSameMembers([
          { effect: "ALLOW", name: "PETITIONS:CHANGE_PATH" },
          { effect: "ALLOW", name: "PETITIONS:CREATE_PETITIONS" },
          { effect: "ALLOW", name: "PETITIONS:CREATE_TEMPLATES" },
          { effect: "DENY", name: "USERS:GHOST_LOGIN" },
        ]),
      });
    });

    it("removes a permission on a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
              permissions {
                effect
                name
              }
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", allUsersGroup.id),
          permissions: [
            {
              effect: "NONE",
              name: "PETITIONS:CREATE_PETITIONS",
            },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateUserGroupPermissions).toEqual({
        id: toGlobalId("UserGroup", allUsersGroup.id),
        permissions: [
          { effect: "ALLOW", name: "PETITIONS:CHANGE_PATH" },
          { effect: "ALLOW", name: "PETITIONS:CREATE_TEMPLATES" },
        ],
      });
    });

    it("updates multiple permissions on a group", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userGroupId: GID!, $permissions: [UpdateUserGroupPermissionsInput!]!) {
            updateUserGroupPermissions(userGroupId: $userGroupId, permissions: $permissions) {
              id
              permissions {
                effect
                name
              }
            }
          }
        `,
        {
          userGroupId: toGlobalId("UserGroup", allUsersGroup.id),
          permissions: [
            { effect: "ALLOW", name: "TAGS:CRUD_TAGS" },
            { effect: "DENY", name: "PETITIONS:CREATE_PETITIONS" },
            { effect: "NONE", name: "PETITIONS:CREATE_TEMPLATES" },
            { effect: "NONE", name: "REPORTS:OVERVIEW" }, // this does nothing
            { effect: "ALLOW", name: "INTEGRATIONS:CRUD_INTEGRATIONS" },
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateUserGroupPermissions).toEqual({
        id: toGlobalId("UserGroup", allUsersGroup.id),
        permissions: expect.toIncludeSameMembers([
          { effect: "ALLOW", name: "PETITIONS:CHANGE_PATH" },
          { effect: "DENY", name: "PETITIONS:CREATE_PETITIONS" },
          { effect: "ALLOW", name: "TAGS:CRUD_TAGS" },
          { effect: "ALLOW", name: "INTEGRATIONS:CRUD_INTEGRATIONS" },
        ]),
      });
    });
  });
});
