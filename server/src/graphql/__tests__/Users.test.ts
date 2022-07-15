import { gql } from "@apollo/client";
import { faker } from "@faker-js/faker";
import { Knex } from "knex";
import { omit } from "remeda";
import { KNEX } from "../../db/knex";
import { UserRepository } from "../../db/repositories/UserRepository";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionPermission,
  TemplateDefaultPermission,
  User,
  UserData,
  UserGroup,
} from "../../db/__types";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { defaultPdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { initServer, TestClient } from "./server";

describe("GraphQL/Users", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let organization: Organization;
  let sessionUser: User;
  let sessionUserData: UserData;
  let sessionUserGID: string;

  let userRepo: UserRepository;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    userRepo = testClient.container.get<UserRepository>(UserRepository);
    mocks = new Mocks(knex);
    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization("ADMIN"));
    sessionUserData = await mocks.loadUserData(sessionUser.user_data_id);

    sessionUserGID = toGlobalId("User", sessionUser.id);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("queries", () => {
    let users: User[];
    let userGroups: UserGroup[];
    beforeAll(async () => {
      users = await mocks.createRandomUsers(
        organization.id,
        6,
        (i) => ({
          status: i === 0 ? "INACTIVE" : "ACTIVE",
        }),
        (i) => ({
          email: i < 3 ? `user${i}@onparallel.com` : faker.internet.email(),
        })
      );

      userGroups = await mocks.createUserGroups(2, organization.id, (i) => ({
        name: i === 0 ? "onparallel" : faker.word.noun(),
      }));
      await mocks.insertUserGroupMembers(
        userGroups[0].id,
        users.slice(1, 3).map((u) => u.id)
      );
    });

    afterAll(async () => {
      await mocks.knex.from("user_group_member").delete();
      await mocks.knex.from("user_group").delete();
      await mocks.knex
        .from("user")
        .whereIn(
          "id",
          users.map((u) => u.id)
        )
        .delete();
    });

    it("fetches session user", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query {
            me {
              id
              fullName
              organization {
                name
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
          name: "Parallel",
        },
      });
    });

    it("searches active users by email domain on the org", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query UserSearch($search: String!) {
            searchUsers(search: $search) {
              ... on User {
                id
                email
              }
              ... on UserGroup {
                id
              }
            }
          }
        `,
        {
          search: "@onparallel.com",
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.searchUsers).toEqual([
        { id: toGlobalId("User", users[1].id), email: "user1@onparallel.com" },
        { id: toGlobalId("User", users[2].id), email: "user2@onparallel.com" },
      ]);
    });

    it("searches users and groups with active members", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query UserSearch($search: String!) {
            searchUsers(search: $search, includeGroups: true) {
              __typename
              ... on User {
                id
                email
              }
              ... on UserGroup {
                id
                name
                members {
                  user {
                    id
                    email
                  }
                }
              }
            }
          }
        `,
        {
          search: "onparal",
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.searchUsers).toEqual([
        {
          __typename: "UserGroup",
          id: toGlobalId("UserGroup", userGroups[0].id),
          name: "onparallel",
          members: [
            { user: { id: toGlobalId("User", users[1].id), email: "user1@onparallel.com" } },
            { user: { id: toGlobalId("User", users[2].id), email: "user2@onparallel.com" } },
          ],
        },
        {
          __typename: "User",
          id: toGlobalId("User", users[1].id),
          email: "user1@onparallel.com",
        },
        {
          __typename: "User",
          id: toGlobalId("User", users[2].id),
          email: "user2@onparallel.com",
        },
      ]);
    });

    it("includes inactive users", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          query UserSearch($search: String!) {
            searchUsers(search: $search, includeInactive: true) {
              ... on User {
                id
                status
                email
              }
              ... on UserGroup {
                id
              }
            }
          }
        `,
        {
          search: "@onparallel.com",
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.searchUsers).toEqual([
        {
          id: toGlobalId("User", users[0].id),
          email: "user0@onparallel.com",
          status: "INACTIVE",
        },
        {
          id: toGlobalId("User", users[1].id),
          email: "user1@onparallel.com",
          status: "ACTIVE",
        },
        {
          id: toGlobalId("User", users[2].id),
          email: "user2@onparallel.com",
          status: "ACTIVE",
        },
      ]);
    });

    it("correctly refreshes dataloader cache when loading user after updating its data", async () => {
      // first request to cache user data
      const { errors: query1Errors, data: query1Data } = await testClient.execute(
        gql`
          query GetUsersOrGroups($id: ID!) {
            getUsersOrGroups(ids: [$id]) {
              ... on User {
                id
                email
                isSsoUser
                role
              }
            }
          }
        `,
        { id: toGlobalId("User", users[2].id) }
      );

      expect(query1Errors).toBeUndefined();
      expect(query1Data?.getUsersOrGroups).toEqual([
        {
          id: toGlobalId("User", users[2].id),
          email: "user2@onparallel.com",
          isSsoUser: false,
          role: "NORMAL",
        },
      ]);

      await userRepo.updateUserData(
        users[2].id,
        { email: "newemail@gmail.com", is_sso_user: true },
        "Test"
      );

      const { errors: query2Errors, data: query2Data } = await testClient.execute(
        gql`
          query GetUsersOrGroups($id: ID!) {
            getUsersOrGroups(ids: [$id]) {
              ... on User {
                id
                email
                isSsoUser
                role
              }
            }
          }
        `,
        { id: toGlobalId("User", users[2].id) }
      );

      expect(query2Errors).toBeUndefined();
      expect(query2Data?.getUsersOrGroups).toEqual([
        {
          id: toGlobalId("User", users[2].id),
          email: "newemail@gmail.com",
          isSsoUser: true,
          role: "NORMAL",
        },
      ]);
    });
  });

  describe("updateUser", () => {
    it("changes user name", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($firstName: String, $lastName: String) {
            updateUser(firstName: $firstName, lastName: $lastName) {
              id
              fullName
            }
          }
        `,
        variables: {
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
    it("refreshes correctly when updating user info", async () => {
      const { errors: query1Errors, data: query1Data } = await testClient.execute(
        gql`
          query {
            me {
              id
              fullName
            }
          }
        `
      );
      expect(query1Errors).toBeUndefined();
      expect(query1Data?.me).toEqual({ id: sessionUserGID, fullName: "Mike Ross" });

      const { errors: updateErrors, data: updateData } = await testClient.execute(
        gql`
          mutation ($firstName: String, $lastName: String) {
            updateUser(firstName: $firstName, lastName: $lastName) {
              id
              fullName
            }
          }
        `,
        { firstName: "Bond,", lastName: "James Bond" }
      );

      expect(updateErrors).toBeUndefined();
      expect(updateData?.updateUser).toEqual({
        id: sessionUserGID,
        fullName: "Bond, James Bond",
      });

      const { data: query2Data } = await testClient.execute(
        gql`
          query {
            me {
              id
              fullName
            }
          }
        `
      );
      expect(query2Data?.me).toEqual({ id: sessionUserGID, fullName: "Bond, James Bond" });
    });
  });

  describe("activate and deactivate Users", () => {
    let activeUsers: User[];
    let inactiveUsers: User[];
    let user0Petition: Petition;
    let user1Petitions: Petition[];
    let user1Template: Petition;

    let otherOrg: Organization;
    let otherOrgUser: User;

    beforeAll(async () => {
      await mocks.knex
        .from("organization")
        .where("id", organization.id)
        .update({ usage_details: { USER_LIMIT: 9 } });
    });

    beforeEach(async () => {
      activeUsers = await mocks.createRandomUsers(organization.id, 3, () => ({
        status: "ACTIVE",
      }));

      inactiveUsers = await mocks.createRandomUsers(organization.id, 2, () => ({
        status: "INACTIVE",
      }));

      [user0Petition] = await mocks.createRandomPetitions(organization.id, activeUsers[0].id, 1);
      [user0Petition] = await mocks.createRandomPetitions(organization.id, activeUsers[0].id, 1);

      user1Petitions = await mocks.createRandomPetitions(organization.id, activeUsers[1].id, 3);
      [user1Template] = await mocks.createRandomPetitions(
        organization.id,
        activeUsers[1].id,
        1,
        () => ({
          is_template: true,
          status: null,
        })
      );
      await mocks.automaticShareTemplateWithUsers(user1Template.id, [activeUsers[0].id]);

      [otherOrg] = await mocks.createRandomOrganizations(1);
      [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1, () => ({
        status: "ACTIVE",
      }));
    });

    it("updates user status to inactive and transfers petition to session user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: sessionUserGID,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deactivateUser).toEqual([
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
          mutation ($userIds: [GID!]!, $transferToUserId: GID) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: toGlobalId("User", activeUsers[2].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deactivateUser).toEqual([
        {
          id: toGlobalId("User", activeUsers[0].id),
          status: "INACTIVE",
        },
      ]);

      const permissions = await mocks.knex
        .from<PetitionPermission>("petition_permission")
        .where("user_id", activeUsers[0].id)
        .whereNull("deleted_at")
        .select("*");
      expect(permissions).toHaveLength(0);

      const members = await mocks.knex
        .from("user_group_member")
        .where({ deleted_at: null, user_group_id: group.id });
      expect(members).toHaveLength(0);

      const defaultPermission = await mocks.knex
        .from<TemplateDefaultPermission>("template_default_permission")
        .whereNull("deleted_at")
        .where("user_id", activeUsers[0].id)
        .where("template_id", user1Template.id)
        .select("*");
      expect(defaultPermission).toHaveLength(0);
    });

    it("updates user status to active without specifying transferToUserId argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!) {
            activateUser(userIds: $userIds) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", inactiveUsers[0].id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.activateUser).toEqual([
        {
          id: toGlobalId("User", inactiveUsers[0].id),
          status: "ACTIVE",
        },
      ]);
    });

    it("updates multiple users to INACTIVE, and transfers all their petitions to another user in the org", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id), toGlobalId("User", activeUsers[1].id)],
          transferToUserId: toGlobalId("User", activeUsers[2].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.deactivateUser).toEqual([
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

    it("sends error when trying to update status to active when reached the user limit", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!) {
            activateUser(userIds: $userIds) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", inactiveUsers[0].id)],
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to update status of a user in another organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!) {
            activateUser(userIds: $userIds) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", otherOrgUser.id)],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to an inactive user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: toGlobalId("User", inactiveUsers[0].id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to a user in another organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: toGlobalId("User", otherOrgUser.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to set status to inactive without specifying transferToUserId argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!) {
            deactivateUser(userIds: $userIds) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to set status to inactive specifying transferToUserId anb deletePetitions", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID, $deletePetitions: Boolean) {
            deactivateUser(
              userIds: $userIds
              transferToUserId: $transferToUserId
              deletePetitions: $deletePetitions
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id), toGlobalId("User", activeUsers[1].id)],
          transferToUserId: toGlobalId("User", activeUsers[2].id),
          deletePetitions: true,
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to set own status", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!) {
            deactivateUser(userIds: $userIds) {
              id
            }
          }
        `,
        variables: {
          userIds: [sessionUserGID],
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to the same user that will be set as inactive", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
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

  describe("createOrganizationUser", () => {
    let normalUser: User;
    let normalUserApiKey: string;

    beforeAll(async () => {
      // make sure there is only one user in the org
      await mocks.knex
        .from("user")
        .whereNot("id", sessionUser.id)
        .update("deleted_at", mocks.knex.raw("CURRENT_TIMESTAMP"));

      [normalUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
        organization_role: "NORMAL",
      }));
      ({ apiKey: normalUserApiKey } = await mocks.createUserAuthToken(
        "normal-token",
        normalUser.id
      ));

      await mocks.knex
        .from("organization")
        .where("id", organization.id)
        .update({ usage_details: { USER_LIMIT: 3 } });
    });

    it("normal users should not be able to create new users", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).mutate({
        mutation: gql`
          mutation (
            $email: String!
            $firstName: String!
            $lastName: String!
            $role: OrganizationRole!
          ) {
            createOrganizationUser(
              email: $email
              firstName: $firstName
              lastName: $lastName
              role: $role
            ) {
              id
            }
          }
        `,
        variables: {
          email: "dwight-schrute@dundermifflin.com",
          firstName: "Dwight",
          lastName: "Schrute",
          role: "NORMAL",
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not create a user if the email is already registered", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $email: String!
            $firstName: String!
            $lastName: String!
            $role: OrganizationRole!
          ) {
            createOrganizationUser(
              email: $email
              firstName: $firstName
              lastName: $lastName
              role: $role
            ) {
              fullName
              role
            }
          }
        `,
        variables: {
          email: sessionUserData.email,
          firstName: "Michael",
          lastName: "Scott",
          role: "ADMIN",
        },
      });

      expect(errors).toContainGraphQLError("EMAIL_ALREADY_REGISTERED_ERROR");
      expect(data).toBeNull();
    });

    it("should not create a user if the email domain has SSO enabled", async () => {
      const [integration] = await mocks.createOrgIntegration({
        org_id: sessionUser.org_id,
        type: "SSO",
        provider: "AZURE",
        settings: { EMAIL_DOMAINS: ["onparallel.com"] },
        is_enabled: true,
      });

      const [, sessionUserDomain] = sessionUserData.email.split("@");
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $email: String!
            $firstName: String!
            $lastName: String!
            $role: OrganizationRole!
          ) {
            createOrganizationUser(
              email: $email
              firstName: $firstName
              lastName: $lastName
              role: $role
            ) {
              fullName
              role
            }
          }
        `,
        variables: {
          email: "newuser@".concat(sessionUserDomain),
          firstName: "Michael",
          lastName: "Scott",
          role: "ADMIN",
        },
      });

      expect(errors).toContainGraphQLError("SSO_PROVIDER_ENABLED");
      expect(data).toBeNull();

      await mocks.knex.from("org_integration").where("id", integration.id).delete();
    });

    it("should create a user in the organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $email: String!
            $firstName: String!
            $lastName: String!
            $role: OrganizationRole!
          ) {
            createOrganizationUser(
              email: $email
              firstName: $firstName
              lastName: $lastName
              role: $role
            ) {
              fullName
              role
            }
          }
        `,
        variables: {
          email: "michael.scott@test.com",
          firstName: "Michael",
          lastName: "Scott",
          role: "ADMIN",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.createOrganizationUser).toEqual({ fullName: "Michael Scott", role: "ADMIN" });
    });

    it("should not create a user if the organization reached the max limit of users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $email: String!
            $firstName: String!
            $lastName: String!
            $role: OrganizationRole!
          ) {
            createOrganizationUser(
              email: $email
              firstName: $firstName
              lastName: $lastName
              role: $role
            ) {
              id
            }
          }
        `,
        variables: {
          email: "jim.halpert@test.com",
          firstName: "Jim",
          lastName: "Halpert",
          role: "NORMAL",
        },
      });
      expect(errors).toContainGraphQLError("USER_LIMIT_ERROR", { userLimit: 3 });
      expect(data).toBeNull();
    });
  });

  describe("userSignUp", () => {
    it("user signup creates organization and default entries", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $captcha: String!
            $email: String!
            $firstName: String!
            $lastName: String!
            $organizationName: String!
            $password: String!
          ) {
            userSignUp(
              captcha: $captcha
              email: $email
              firstName: $firstName
              lastName: $lastName
              organizationName: $organizationName
              password: $password
            ) {
              id
            }
          }
        `,
        {
          captcha: "xxx",
          email: "test@onparallel.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "MyOrganization",
          password: "sup€rs@f3P4ssw0rd",
        }
      );

      expect(errors).toBeUndefined();

      const { apiKey } = await mocks.createUserAuthToken(
        "api-token",
        fromGlobalId(data!.userSignUp.id, "User").id
      );
      const { errors: queryErrors, data: queryData } = await testClient.withApiKey(apiKey)
        .execute(gql`
        query me {
          me {
            id
            fullName
            organization {
              name
              integrations(limit: 10, offset: 0) {
                totalCount
                items {
                  type
                  name
                  isDefault
                }
              }
              pdfDocumentThemes {
                name
                isDefault
                data
              }
              usageLimits {
                petitions {
                  limit
                  used
                }
                signatures {
                  limit
                  used
                }
                users {
                  limit
                }
              }
            }
          }
        }
      `);

      expect(queryErrors).toBeUndefined();
      expect(queryData).toEqual({
        me: {
          id: data!.userSignUp.id,
          fullName: "Test User",
          organization: {
            name: "MyOrganization",
            integrations: {
              totalCount: 1,
              items: [{ type: "SIGNATURE", name: "Signaturit Sandbox", isDefault: true }],
            },
            pdfDocumentThemes: [
              {
                name: "Default",
                isDefault: true,
                data: omit(defaultPdfDocumentTheme, ["logoPosition", "paginationPosition"]),
              },
            ],
            usageLimits: {
              petitions: {
                limit: 20,
                used: 0,
              },
              signatures: null,
              users: {
                limit: 2,
              },
            },
          },
        },
      });
    });
  });
});
