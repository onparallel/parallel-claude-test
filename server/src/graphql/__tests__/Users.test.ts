import gql from "graphql-tag";
import knex, { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionPermission, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Users", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let organization: Organization;
  let sessionUser: User;
  let sessionUserGID: string;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));

    [sessionUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
      organization_role: "ADMIN",
    }));

    sessionUserGID = toGlobalId("User", sessionUser.id);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("queries", () => {
    it("fetches session user", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            me {
              id
              fullName
              organization {
                identifier
              }
            }
          }
        `,
      });
      expect(errors).toBeUndefined();
      expect(data!.me).toEqual({
        id: sessionUserGID,
        fullName: "Harvey Specter",
        organization: {
          identifier: "parallel",
        },
      });
    });
  });

  describe("updateUser", () => {
    it("changes user name", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userId: GID!, $firstName: String, $lastName: String) {
            updateUser(id: $userId, data: { firstName: $firstName, lastName: $lastName }) {
              id
              fullName
            }
          }
        `,
        variables: {
          userId: sessionUserGID,
          firstName: "Mike",
          lastName: "Ross",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateUser).toEqual({
        id: sessionUserGID,
        fullName: "Mike Ross",
      });
    });
  });

  describe("updateUserStatus", () => {
    let activeUsers: User[];
    let inactiveUser: User;
    let user0Petition: Petition;
    let user1Petitions: Petition[];

    let otherOrg: Organization;
    let otherOrgUser: User;

    beforeEach(async () => {
      activeUsers = await mocks.createRandomUsers(organization.id, 3, () => ({
        status: "ACTIVE",
      }));

      [inactiveUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
        status: "INACTIVE",
      }));

      [user0Petition] = await mocks.createRandomPetitions(organization.id, activeUsers[0].id, 1);

      user1Petitions = await mocks.createRandomPetitions(organization.id, activeUsers[1].id, 3);

      [otherOrg] = await mocks.createRandomOrganizations(1);
      [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1, () => ({
        status: "ACTIVE",
      }));
    });

    it("updates user status to inactive and transfers petition to session user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!, $transferToUserId: GID) {
            updateUserStatus(
              userIds: $userIds
              status: $status
              transferToUserId: $transferToUserId
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          status: "INACTIVE",
          transferToUserId: sessionUserGID,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateUserStatus).toEqual([
        {
          id: toGlobalId("User", activeUsers[0].id),
          status: "INACTIVE",
        },
      ]);

      // query petition to make sure the permissions are correctly set
      const { errors: petitionErrors, data: petitionData } = await testClient.query({
        query: gql`
          query petition($id: GID!) {
            petition(id: $id) {
              id
              permissions {
                ... on PetitionUserPermission {
                  permissionType
                  user {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          id: toGlobalId("Petition", user0Petition.id),
        },
      });

      expect(petitionErrors).toBeUndefined();
      expect(petitionData?.petition).toEqual({
        id: toGlobalId("Petition", user0Petition.id),
        permissions: [
          {
            permissionType: "OWNER",
            user: {
              id: sessionUserGID,
            },
          },
        ],
      });
    });

    it("removes user from all their groups and deletes all petition permissions", async () => {
      // create a group, add user as member and share a petition with the group
      const [group] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(group.id, [activeUsers[0].id]);
      await mocks.sharePetitionWithGroups(user0Petition.id, [group.id]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!, $transferToUserId: GID) {
            updateUserStatus(
              userIds: $userIds
              status: $status
              transferToUserId: $transferToUserId
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: toGlobalId("User", activeUsers[2].id),
          status: "INACTIVE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateUserStatus).toEqual([
        {
          id: toGlobalId("User", activeUsers[0].id),
          status: "INACTIVE",
        },
      ]);

      const permissions = await mocks.knex
        .from<PetitionPermission>("petition_permission")
        .whereNull("deleted_at")
        .select("*");
      const members = await mocks.knex
        .from("user_group_member")
        .where({ deleted_at: null, user_group_id: group.id });

      expect(permissions.every((p) => p.user_id !== activeUsers[0].id));
      expect(members).toHaveLength(0);
    });

    it("updates user status to active without specifying transferToUserId argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!) {
            updateUserStatus(userIds: $userIds, status: $status) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", inactiveUser.id)],
          status: "ACTIVE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.updateUserStatus).toEqual([
        {
          id: toGlobalId("User", inactiveUser.id),
          status: "ACTIVE",
        },
      ]);
    });

    it("updates multiple users to INACTIVE, and transfers all their petitions to another user in the org", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!, $transferToUserId: GID) {
            updateUserStatus(
              userIds: $userIds
              status: $status
              transferToUserId: $transferToUserId
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id), toGlobalId("User", activeUsers[1].id)],
          status: "INACTIVE",
          transferToUserId: toGlobalId("User", activeUsers[2].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateUserStatus).toEqual([
        {
          id: toGlobalId("User", activeUsers[0].id),
          status: "INACTIVE",
        },
        {
          id: toGlobalId("User", activeUsers[1].id),
          status: "INACTIVE",
        },
      ]);

      // query petition to make sure the permissions are correctly set
      // as petitions are private for each user, here we have to obtain the info directly from the database
      const { rows: petitionUserPermissions } = await mocks.knex.raw(
        /* sql */ `
        select petition_id, type, user_id, updated_by 
        from petition_permission 
        where petition_id in (?,?,?,?) and deleted_at is null`,
        [user0Petition.id, ...user1Petitions.map((p) => p.id)]
      );

      expect(petitionUserPermissions).toEqual([
        {
          petition_id: user0Petition.id,
          type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
        {
          petition_id: user1Petitions[0].id,
          type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
        {
          petition_id: user1Petitions[1].id,
          type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
        {
          petition_id: user1Petitions[2].id,
          type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
      ]);
    });

    it("sends error when trying to update status of a user in another organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!) {
            updateUserStatus(userIds: $userIds, status: $status) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", otherOrgUser.id)],
          status: "ACTIVE",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to an inactive user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!, $transferToUserId: GID) {
            updateUserStatus(
              userIds: $userIds
              status: $status
              transferToUserId: $transferToUserId
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          status: "INACTIVE",
          transferToUserId: toGlobalId("User", inactiveUser.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to a user in another organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!, $transferToUserId: GID) {
            updateUserStatus(
              userIds: $userIds
              status: $status
              transferToUserId: $transferToUserId
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          status: "INACTIVE",
          transferToUserId: toGlobalId("User", otherOrgUser.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to set status to inactive without specifying transferToUserId argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!) {
            updateUserStatus(userIds: $userIds, status: $status) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          status: "INACTIVE",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to set own status", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!) {
            updateUserStatus(userIds: $userIds, status: $status) {
              id
            }
          }
        `,
        variables: {
          userIds: [sessionUserGID],
          status: "INACTIVE",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to the same user that will be set as inactive", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $status: UserStatus!, $transferToUserId: GID) {
            updateUserStatus(
              userIds: $userIds
              status: $status
              transferToUserId: $transferToUserId
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          status: "INACTIVE",
          transferToUserId: toGlobalId("User", activeUsers[0].id),
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("updateOrganizationUser", () => {
    let orgOwner: User;
    let adminUser: User;
    let normalUser: User;

    let ownerApiKey: string;
    let adminApiKey: string;
    let normalApiKey: string;

    beforeEach(async () => {
      [orgOwner, adminUser, normalUser] = await mocks.createRandomUsers(
        organization.id,
        3,
        (i) => ({
          organization_role: i === 0 ? "OWNER" : i === 1 ? "ADMIN" : "NORMAL",
        })
      );

      [{ apiKey: ownerApiKey }, { apiKey: adminApiKey }, { apiKey: normalApiKey }] =
        await Promise.all([
          mocks.createUserAuthToken("owner-token", orgOwner.id),
          mocks.createUserAuthToken("admin-token", adminUser.id),
          mocks.createUserAuthToken("normal-token", normalUser.id),
        ]);
    });

    afterEach(async () => {
      await mocks.knex
        .from("user")
        .where("organization_role", "OWNER")
        .update("deleted_at", new Date());
    });

    it("organization owner should be able to change the role of any user in the same org", async () => {
      const { errors, data } = await testClient.withApiKey(ownerApiKey).mutate({
        mutation: gql`
          mutation ($userId: GID!, $role: OrganizationRole!) {
            updateOrganizationUser(userId: $userId, role: $role) {
              id

              role
            }
          }
        `,
        variables: {
          userId: toGlobalId("User", adminUser.id),
          role: "NORMAL",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateOrganizationUser).toEqual({
        id: toGlobalId("User", adminUser.id),
        role: "NORMAL",
      });
    });

    it("organization owner should not be able to update their own role", async () => {
      const { errors, data } = await testClient.withApiKey(ownerApiKey).mutate({
        mutation: gql`
          mutation ($userId: GID!, $role: OrganizationRole!) {
            updateOrganizationUser(userId: $userId, role: $role) {
              id
            }
          }
        `,
        variables: {
          userId: toGlobalId("User", orgOwner.id),
          role: "ADMIN",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("admin should not be able to update their own role", async () => {
      const { errors, data } = await testClient.withApiKey(adminApiKey).mutate({
        mutation: gql`
          mutation ($userId: GID!, $role: OrganizationRole!) {
            updateOrganizationUser(userId: $userId, role: $role) {
              id
            }
          }
        `,
        variables: {
          userId: toGlobalId("User", adminUser.id),
          role: "NORMAL",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("org admins should be able to change the role of another admin", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userId: GID!, $role: OrganizationRole!) {
            updateOrganizationUser(userId: $userId, role: $role) {
              id
              role
            }
          }
        `,
        variables: {
          userId: toGlobalId("User", adminUser.id),
          role: "NORMAL",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateOrganizationUser).toEqual({
        id: toGlobalId("User", adminUser.id),
        role: "NORMAL",
      });
    });

    it("org admins should not be able to update the role of an owner", async () => {
      const { errors, data } = await testClient.withApiKey(adminApiKey).mutate({
        mutation: gql`
          mutation ($userId: GID!, $role: OrganizationRole!) {
            updateOrganizationUser(userId: $userId, role: $role) {
              id
            }
          }
        `,
        variables: {
          userId: toGlobalId("User", orgOwner.id),
          role: "NORMAL",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("admins should not be able to update the role of a user in another organization", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userId: GID!, $role: OrganizationRole!) {
            updateOrganizationUser(userId: $userId, role: $role) {
              id
            }
          }
        `,
        variables: {
          userId: toGlobalId("User", otherOrgUser.id),
          role: "NORMAL",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("normal users should not be able to update info of any other user", async () => {
      const { errors, data } = await testClient.withApiKey(normalApiKey).mutate({
        mutation: gql`
          mutation ($userId: GID!, $role: OrganizationRole!) {
            updateOrganizationUser(userId: $userId, role: $role) {
              id
            }
          }
        `,
        variables: {
          userId: toGlobalId("User", adminUser.id),
          role: "NORMAL",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });
});
