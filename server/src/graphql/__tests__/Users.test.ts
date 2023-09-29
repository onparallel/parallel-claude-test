import { faker } from "@faker-js/faker";
import gql from "graphql-tag";
import { Knex } from "knex";
import { omit } from "remeda";
import {
  Organization,
  Petition,
  PetitionPermission,
  TemplateDefaultPermission,
  User,
  UserData,
  UserGroup,
} from "../../db/__types";
import { KNEX } from "../../db/knex";
import { UserRepository } from "../../db/repositories/UserRepository";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { defaultPdfDocumentTheme } from "../../util/PdfDocumentTheme";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { TestClient, initServer } from "./server";

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
    ({ organization, user: sessionUser } = await mocks.createSessionUserAndOrganization());
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
        }),
      );

      userGroups = await mocks.createUserGroups(2, organization.id, [], (i) => ({
        name: i === 0 ? "onparallel" : faker.word.noun(),
      }));
      await mocks.insertUserGroupMembers(
        userGroups[0].id,
        users.slice(1, 3).map((u) => u.id),
      );
    });

    afterAll(async () => {
      const allUsersGroup = await mocks.knex
        .from("user_group")
        .where("type", "ALL_USERS")
        .select("*");
      await mocks.knex
        .from("user_group_member")
        .whereIn(
          "user_id",
          users.map((u) => u.id),
        )
        .delete();
      await mocks.knex
        .from("user_group_permission")
        .whereNotIn(
          "user_group_id",
          allUsersGroup.map((g) => g.id),
        )
        .delete();
      await mocks.knex
        .from("user_group")
        .whereNotIn(
          "id",
          allUsersGroup.map((g) => g.id),
        )
        .delete();
      await mocks.knex
        .from("user")
        .whereIn(
          "id",
          users.map((u) => u.id),
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
        },
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
        },
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
        },
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
              }
            }
          }
        `,
        { id: toGlobalId("User", users[2].id) },
      );

      expect(query1Errors).toBeUndefined();
      expect(query1Data?.getUsersOrGroups).toEqual([
        {
          id: toGlobalId("User", users[2].id),
          email: "user2@onparallel.com",
          isSsoUser: false,
        },
      ]);

      await userRepo.updateUserData(
        users[2].user_data_id,
        { email: "newemail@gmail.com", is_sso_user: true },
        "Test",
      );

      const { errors: query2Errors, data: query2Data } = await testClient.execute(
        gql`
          query GetUsersOrGroups($id: ID!) {
            getUsersOrGroups(ids: [$id]) {
              ... on User {
                id
                email
                isSsoUser
              }
            }
          }
        `,
        { id: toGlobalId("User", users[2].id) },
      );

      expect(query2Errors).toBeUndefined();
      expect(query2Data?.getUsersOrGroups).toEqual([
        {
          id: toGlobalId("User", users[2].id),
          email: "newemail@gmail.com",
          isSsoUser: true,
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
      const { errors: query1Errors, data: query1Data } = await testClient.execute(gql`
        query {
          me {
            id
            fullName
          }
        }
      `);
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
        { firstName: "Bond,", lastName: "James Bond" },
      );

      expect(updateErrors).toBeUndefined();
      expect(updateData?.updateUser).toEqual({
        id: sessionUserGID,
        fullName: "Bond, James Bond",
      });

      const { data: query2Data } = await testClient.execute(gql`
        query {
          me {
            id
            fullName
          }
        }
      `);
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
        .update({ usage_details: { USER_LIMIT: 100 } });
    });

    beforeEach(async () => {
      activeUsers = await mocks.createRandomUsers(organization.id, 3, () => ({
        status: "ACTIVE",
      }));

      inactiveUsers = await mocks.createRandomUsers(organization.id, 2, () => ({
        status: "INACTIVE",
      }));

      [user0Petition] = await mocks.createRandomPetitions(organization.id, activeUsers[0].id, 1);

      user1Petitions = await mocks.createRandomPetitions(organization.id, activeUsers[1].id, 3);
      [user1Template] = await mocks.createRandomPetitions(
        organization.id,
        activeUsers[1].id,
        1,
        () => ({
          is_template: true,
          status: null,
        }),
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
          mutation ($userIds: [GID!]!, $transferToUserId: GID!, $includeDrafts: Boolean) {
            deactivateUser(
              userIds: $userIds
              transferToUserId: $transferToUserId
              includeDrafts: $includeDrafts
            ) {
              id
              status
            }
          }
        `,
        variables: {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: sessionUserGID,
          includeDrafts: true, // also transfer drafts, this way those won't be deleted and the next query on this test will not fail
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
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
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

    it("updates user status to active", async () => {
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
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
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
        where petition_id in (?,?,?,?) and deleted_at is null
        order by petition_id asc`,
        [user0Petition.id, ...user1Petitions.map((p) => p.id)],
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
      const activeUsers = await mocks.knex
        .from("user")
        .where({ status: "ACTIVE", org_id: organization.id })
        .select("*");

      await mocks.knex
        .from("organization")
        .where("id", organization.id)
        .update({ usage_details: { USER_LIMIT: activeUsers.length } });

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

      await mocks.knex
        .from("organization")
        .where("id", organization.id)
        .update({ usage_details: { USER_LIMIT: 100 } });
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
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
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
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
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

    it("sends error when trying to deactivate organization owner", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
            }
          }
        `,
        variables: {
          userIds: [sessionUserGID],
          transferToUserId: toGlobalId("User", activeUsers[0].id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when trying to deactivate myself (not owner)", async () => {
      const [admin] = await mocks.createRandomUsers(organization.id);
      const [adminGroup] = await mocks.createUserGroups(1, organization.id, {
        effect: "GRANT",
        name: "USERS:CRUD_USERS",
      });
      await mocks.insertUserGroupMembers(adminGroup.id, [admin.id]);
      const { apiKey } = await mocks.createUserAuthToken("admin", admin.id);
      const { errors, data } = await testClient.withApiKey(apiKey).execute(
        gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
            }
          }
        `,
        {
          userIds: [toGlobalId("User", admin.id)],
          transferToUserId: toGlobalId("User", activeUsers[0].id),
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to the same user that will be set as inactive", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
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

  describe("inviteUserToOrganization", () => {
    let normalUser: User;
    let normalUserApiKey: string;

    beforeAll(async () => {
      // make sure there is only one user in the org
      await mocks.knex
        .from("user")
        .whereNot("id", sessionUser.id)
        .update("deleted_at", mocks.knex.raw("CURRENT_TIMESTAMP"));

      [normalUser] = await mocks.createRandomUsers(organization.id, 1);
      ({ apiKey: normalUserApiKey } = await mocks.createUserAuthToken(
        "normal-token",
        normalUser.id,
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
            $locale: UserLocale!
          ) {
            inviteUserToOrganization(
              email: $email
              firstName: $firstName
              lastName: $lastName
              locale: $locale
            ) {
              id
            }
          }
        `,
        variables: {
          email: "dwight-schrute@dundermifflin.com",
          firstName: "Dwight",
          lastName: "Schrute",
          locale: "en",
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("should not create a user if the email is already registered on that organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $email: String!
            $firstName: String!
            $lastName: String!
            $locale: UserLocale!
          ) {
            inviteUserToOrganization(
              email: $email
              firstName: $firstName
              lastName: $lastName
              locale: $locale
            ) {
              fullName
            }
          }
        `,
        variables: {
          email: sessionUserData.email,
          firstName: "Michael",
          lastName: "Scott",
          locale: "en",
        },
      });

      expect(errors).toContainGraphQLError("USER_ALREADY_IN_ORG_ERROR");
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
            $locale: UserLocale!
          ) {
            inviteUserToOrganization(
              email: $email
              firstName: $firstName
              lastName: $lastName

              locale: $locale
            ) {
              fullName
            }
          }
        `,
        variables: {
          email: "newuser@".concat(sessionUserDomain),
          firstName: "Michael",
          lastName: "Scott",
          role: "ADMIN",
          locale: "en",
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
            $locale: UserLocale!
          ) {
            inviteUserToOrganization(
              email: $email
              firstName: $firstName
              lastName: $lastName
              locale: $locale
            ) {
              fullName
            }
          }
        `,
        variables: {
          email: "michael.scott@test.com",
          firstName: "Michael",
          lastName: "Scott",
          locale: "en",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.inviteUserToOrganization).toEqual({ fullName: "Michael Scott" });
    });

    it("should not create a user if the organization reached the max limit of users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $email: String!
            $firstName: String!
            $lastName: String!
            $locale: UserLocale!
          ) {
            inviteUserToOrganization(
              email: $email
              firstName: $firstName
              lastName: $lastName
              locale: $locale
            ) {
              id
            }
          }
        `,
        variables: {
          email: "jim.halpert@test.com",
          firstName: "Jim",
          lastName: "Halpert",
          locale: "en",
        },
      });
      expect(errors).toContainGraphQLError("USER_LIMIT_ERROR", { userLimit: 3 });
      expect(data).toBeNull();
    });
  });

  describe("signUp", () => {
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
            $locale: UserLocale!
          ) {
            signUp(
              captcha: $captcha
              email: $email
              firstName: $firstName
              lastName: $lastName
              organizationName: $organizationName
              password: $password
              locale: $locale
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
          locale: "en",
        },
      );

      expect(errors).toBeUndefined();

      const { apiKey } = await mocks.createUserAuthToken(
        "api-token",
        fromGlobalId(data!.signUp.id, "User").id,
      );
      const { errors: orgQueryErrors, data: orgQueryData } = await testClient
        .withApiKey(apiKey)
        .execute(gql`
          query me {
            me {
              id
              fullName
              preferredLocale
              permissions
              userGroups {
                id
                type
                memberCount
                members {
                  user {
                    id
                  }
                }
                permissions {
                  effect
                  name
                }
              }
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
                usageDetails
                petitionsPeriod: usagePeriods(limit: 100, offset: 0, limitName: PETITION_SEND) {
                  items {
                    limit
                    used
                    period
                  }
                }
                signaturesPeriod: usagePeriods(
                  limit: 100
                  offset: 0
                  limitName: SIGNATURIT_SHARED_APIKEY
                ) {
                  items {
                    limit
                    used
                    period
                  }
                }
              }
            }
          }
        `);

      expect(orgQueryErrors).toBeUndefined();
      expect(orgQueryData).toEqual({
        me: {
          id: data!.signUp.id,
          fullName: "Test User",
          preferredLocale: "en",
          permissions: expect.toIncludeSameMembers([
            "REPORTS:OVERVIEW",
            "REPORTS:TEMPLATE_STATISTICS",
            "REPORTS:TEMPLATE_REPLIES",
            "TAGS:CREATE_TAGS",
            "TAGS:UPDATE_TAGS",
            "TAGS:DELETE_TAGS",
            "PROFILES:DELETE_PROFILES",
            "PROFILES:DELETE_PERMANENTLY_PROFILES",
            "PROFILE_TYPES:CRUD_PROFILE_TYPES",
            "INTEGRATIONS:CRUD_INTEGRATIONS",
            "USERS:CRUD_USERS",
            "USERS:GHOST_LOGIN",
            "TEAMS:CRUD_TEAMS",
            "TEAMS:CRUD_PERMISSIONS",
            "ORG_SETTINGS",
            "CONTACTS:DELETE_CONTACTS",
            "PETITIONS:SEND_ON_BEHALF",
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
          ]),
          userGroups: [
            {
              id: expect.any(String),
              type: "ALL_USERS",
              memberCount: 1,
              members: [{ user: { id: data!.signUp.id } }],
              permissions: expect.toIncludeSameMembers(
                [
                  "REPORTS:OVERVIEW",
                  "REPORTS:TEMPLATE_STATISTICS",
                  "REPORTS:TEMPLATE_REPLIES",
                  "TAGS:CREATE_TAGS",
                  "TAGS:UPDATE_TAGS",
                  "TAGS:DELETE_TAGS",
                  "PROFILES:DELETE_PROFILES",
                  "PROFILES:DELETE_PERMANENTLY_PROFILES",
                  "PROFILE_TYPES:CRUD_PROFILE_TYPES",
                  "INTEGRATIONS:CRUD_INTEGRATIONS",
                  "USERS:CRUD_USERS",
                  "USERS:GHOST_LOGIN",
                  "TEAMS:CRUD_TEAMS",
                  "TEAMS:CRUD_PERMISSIONS",
                  "ORG_SETTINGS",
                  "CONTACTS:DELETE_CONTACTS",
                  "PETITIONS:SEND_ON_BEHALF",
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
                ].map((name) => ({ effect: "GRANT", name })),
              ),
            },
          ],
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
            usageDetails: {
              USER_LIMIT: 2,
              PETITION_SEND: {
                limit: 20,
                duration: { months: 1 },
              },
            },
            petitionsPeriod: {
              items: [{ limit: 20, used: 0, period: { months: 1 } }],
            },
            signaturesPeriod: {
              items: [],
            },
          },
        },
      });

      await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);

      // make sure profile types were correctly setup on the new organization
      const { errors: profilesErrors, data: profilesData } = await testClient
        .withApiKey(apiKey)
        .execute(
          gql`
            query ($limit: Int, $offset: Int) {
              profileTypes(limit: $limit, offset: $offset) {
                totalCount
                items {
                  name
                  profileNamePattern
                  fields {
                    id
                    type
                    name
                    alias
                    isExpirable
                    expiryAlertAheadTime
                    options
                    position
                  }
                }
              }
            }
          `,
          {
            limit: 10,
            offset: 0,
          },
        );

      expect(profilesErrors).toBeUndefined();
      expect(profilesData).toEqual({
        profileTypes: {
          totalCount: 3,
          items: [
            {
              name: { en: "Individual", es: "Persona física" },
              profileNamePattern: `{{ ${profilesData.profileTypes.items[0].fields[0].id} }} {{ ${profilesData.profileTypes.items[0].fields[1].id} }}`,
              fields: [
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "First name", es: "Nombre" },
                  alias: "FIRST_NAME",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 0,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Last name", es: "Apellido" },
                  alias: "LAST_NAME",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 1,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "ID", es: "Documento de identificación" },
                  alias: "ID",
                  isExpirable: true,
                  expiryAlertAheadTime: { months: 1 },
                  options: {},
                  position: 2,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: { en: "Date of birth", es: "Fecha de nacimiento" },
                  alias: "DATE_OF_BIRTH",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { useReplyAsExpiryDate: false },
                  position: 3,
                },
                {
                  id: expect.any(String),
                  type: "PHONE",
                  name: { en: "Phone number", es: "Número de teléfono" },
                  alias: "PHONE_NUMBER",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 4,
                },
                {
                  id: expect.any(String),
                  type: "TEXT",
                  name: { en: "Address", es: "Dirección" },
                  alias: "ADDRESS",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 5,
                },
              ],
            },
            {
              name: { en: "Legal entity", es: "Persona jurídica" },
              profileNamePattern: `{{ ${profilesData.profileTypes.items[1].fields[0].id} }}`,
              fields: [
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Corporate name", es: "Denominación social" },
                  alias: "NAME",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 0,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: { en: "Date of incorporation", es: "Fecha de constitución" },
                  alias: "DATE_OF_INCORPORATION",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { useReplyAsExpiryDate: false },
                  position: 1,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Tax ID", es: "Número de identificación fiscal" },
                  alias: "TAX_ID",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 2,
                },
                {
                  id: expect.any(String),
                  type: "TEXT",
                  name: { en: "Address", es: "Domicilio" },
                  alias: "ADDRESS",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 3,
                },
              ],
            },
            {
              name: { en: "Contract", es: "Contrato" },
              profileNamePattern: `{{ ${profilesData.profileTypes.items[2].fields[0].id} }} - {{ ${profilesData.profileTypes.items[2].fields[1].id} }}`,
              fields: [
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Type of contract", es: "Tipo de contrato" },
                  alias: "TYPE",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 0,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT" as const,
                  name: { en: "Counterparty", es: "Contraparte" },
                  alias: "COUNTERPARTY",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 1,
                },
                {
                  id: expect.any(String),
                  type: "TEXT" as const,
                  name: { en: "Short description", es: "Descripción breve" },
                  alias: "DESCRIPTION",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 2,
                },
                {
                  id: expect.any(String),
                  type: "DATE" as const,
                  name: { en: "Start date", es: "Fecha de inicio" },
                  alias: "START_DATE",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { useReplyAsExpiryDate: false },
                  position: 3,
                },
                {
                  id: expect.any(String),
                  type: "DATE" as const,
                  name: { en: "Expiry date", es: "Fecha de vencimiento" },
                  alias: "EXPIRY_DATE",
                  isExpirable: true,
                  expiryAlertAheadTime: { months: 1 },
                  options: { useReplyAsExpiryDate: true },
                  position: 4,
                },
                {
                  id: expect.any(String),
                  type: "NUMBER" as const,
                  name: { en: "Amount", es: "Importe" },
                  alias: "AMOUNT",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 5,
                },
                {
                  id: expect.any(String),
                  type: "FILE" as const,
                  name: { en: "Document", es: "Documento" },
                  alias: "DOCUMENT",
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 6,
                },
              ],
            },
          ],
        },
      });

      // make sure default user group is created
      const { errors: userGroupsQueryErrors, data: userGroupsQueryData } = await testClient
        .withApiKey(apiKey)
        .execute(
          gql`
            query ($limit: Int, $offset: Int) {
              userGroups(limit: $limit, offset: $offset) {
                items {
                  imMember
                  memberCount
                  name
                  type
                  members {
                    user {
                      id
                    }
                  }
                }
                totalCount
              }
            }
          `,
          {
            limit: 1_000,
            offset: 0,
          },
        );

      expect(userGroupsQueryErrors).toBeUndefined();
      expect(userGroupsQueryData?.userGroups).toEqual({
        totalCount: 1,
        items: [
          {
            imMember: true,
            memberCount: 1,
            name: "",
            type: "ALL_USERS",
            members: [{ user: { id: data!.signUp.id } }],
          },
        ],
      });
    });
  });
});
