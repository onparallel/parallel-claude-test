import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionPermission, User, UserGroup } from "../../db/__types";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/UserGroups", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let organization: Organization;
  let sessionUser: User;

  let users: User[];
  let userGroups: UserGroup[];
  let petition: Petition;
  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization({
      organization_role: "ADMIN",
    }));

    [petition] = await mocks.createRandomPetitions(organization.id, sessionUser.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  beforeEach(async () => {
    await mocks.knex.from("petition_permission").delete();
    await mocks.knex.from("user_group_member").delete();
    await mocks.knex.from("user_group").delete();
    userGroups = await mocks.createUserGroups(3, organization.id, (i) => ({
      name: i === 0 ? "First Group" : i === 1 ? "Second Group" : "Third Group",
    }));
    users = await mocks.createRandomUsers(organization.id, 4);
    await mocks.insertUserGroupMembers(
      userGroups[0].id,
      users.slice(0, 3).map((user) => user.id)
    );

    await mocks.knex<PetitionPermission>("petition_permission").insert([
      {
        user_id: sessionUser.id,
        petition_id: petition.id,
        type: "OWNER",
      },
    ]);

    await mocks.sharePetitionWithGroups(petition.id, [userGroups[0].id]);
  });

  it("lists all available user groups in the org", async () => {
    const { data, errors } = await testClient.query({
      query: gql`
        query UserGroups {
          userGroups(limit: 100, offset: 0) {
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
    });

    expect(errors).toBeUndefined();
    expect(data!.userGroups).toEqual({
      totalCount: 3,
      items: userGroups.map((ug) => ({
        id: toGlobalId("UserGroup", ug.id),
        members:
          ug.id === userGroups[0].id
            ? users.slice(0, 3).map((user) => ({
                user: { id: toGlobalId("User", user.id) },
              }))
            : [],
      })),
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
            }
          }
        }
      `,
    });

    expect(errors).toBeUndefined();
    expect(data!.userGroups).toEqual({
      totalCount: 3,
      items: userGroups
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ug) => ({
          id: toGlobalId("UserGroup", ug.id),
        })),
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
            }
          }
        }
      `,
    });
    expect(errors).toBeUndefined();
    expect(data?.userGroups).toEqual({
      totalCount: 2,
      items: [
        { id: toGlobalId("UserGroup", userGroups[0].id) },
        { id: toGlobalId("UserGroup", userGroups[1].id) },
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
        q.where("from_user_group_id", userGroups[0].id).orWhere("user_group_id", userGroups[0].id)
      );

    expect(groupPermissions).toHaveLength(0);
  });

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

  it("clones a user group and all its members", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation UserGroups_cloneUserGroup($userGroupIds: [GID!]!) {
          cloneUserGroup(userGroupIds: $userGroupIds, locale: "en") {
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
      },
    });
    expect(errors).toBeUndefined();
    expect(data?.cloneUserGroup).toEqual([
      {
        name: userGroups[0].name.concat(" (copy)"),
        members: users.slice(0, 3).map((user) => ({ user: { id: toGlobalId("User", user.id) } })),
      },
    ]);
  });

  it("cloning a user group should not clone the group permissions", async () => {
    const { data, errors } = await testClient.mutate({
      mutation: gql`
        mutation UserGroups_cloneUserGroup($userGroupIds: [GID!]!) {
          cloneUserGroup(userGroupIds: $userGroupIds, locale: "en") {
            id
          }
        }
      `,
      variables: {
        userGroupIds: [toGlobalId("UserGroup", userGroups[0].id)],
      },
    });
    expect(errors).toBeUndefined();
    const newGroupId = fromGlobalId(data?.cloneUserGroup[0].id, "UserGroup").id;
    const newGroupPermissions = await mocks
      .knex<PetitionPermission>("petition_permission")
      .whereNull("deleted_at")
      .andWhere((q) =>
        q.where("user_group_id", newGroupId).orWhere("from_user_group_id", newGroupId)
      )
      .select("*");

    expect(newGroupPermissions).toHaveLength(0);
  });
});
