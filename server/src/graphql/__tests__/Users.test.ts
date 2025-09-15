import { faker } from "@faker-js/faker";
import gql from "graphql-tag";
import { Knex } from "knex";
import { omit } from "remeda";
import {
  Organization,
  Petition,
  PetitionPermission,
  Profile,
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
          email:
            i < 3
              ? `user${i}@onparallel.com`
              : faker.internet.email({ provider: "onparallel.com" }),
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
            me {
              organization {
                users(limit: 100, offset: 0, search: $search, filters: { status: [ACTIVE] }) {
                  items {
                    id
                    email
                  }
                }
              }
            }
          }
        `,
        {
          search: "user1@onp",
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.me.organization.users.items).toEqual([
        { id: toGlobalId("User", users[1].id), email: "user1@onparallel.com" },
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

  describe("activateUser, deactivateUser", () => {
    let activeUsers: User[];
    let inactiveUsers: User[];
    let user0Petition: Petition;
    let user0Drafts: Petition[];

    let user1Petitions: Petition[];
    let user1Template: Petition;

    let otherOrg: Organization;
    let otherOrgUser: User;

    let profiles: Profile[];

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

      user0Drafts = await mocks.createRandomPetitions(
        organization.id,
        activeUsers[0].id,
        2,
        () => ({ status: "DRAFT" }),
      );

      [user0Petition] = await mocks.createRandomPetitions(
        organization.id,
        activeUsers[0].id,
        1,
        () => ({ status: "PENDING" }),
      );

      user1Petitions = await mocks.createRandomPetitions(
        organization.id,
        activeUsers[1].id,
        3,
        () => ({ status: "PENDING" }),
      );
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

      const [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      profiles = await mocks.createRandomProfiles(organization.id, profileType.id, 3);
      await mocks.knex.from("profile_subscription").insert(
        profiles.map((profile) => ({
          user_id: activeUsers[0].id,
          profile_id: profile.id,
        })),
      );
    });

    it("updates user status to inactive and transfers petition to session user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
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
        {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: sessionUserGID,
          includeDrafts: true, // also transfer drafts, this way those won't be deleted and the next query on this test will not fail
        },
      );

      expect(errors).toBeUndefined();
      expect(data!.deactivateUser).toEqual([
        {
          id: toGlobalId("User", activeUsers[0].id),
          status: "INACTIVE",
        },
      ]);

      // query petition to make sure the permissions are correctly set
      const { errors: petitionsErrors, data: petitionsData } = await testClient.execute(gql`
        query {
          petitions(offset: 0, limit: 100) {
            totalCount
            items {
              ... on PetitionBase {
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
          }
        }
      `);

      expect(petitionsErrors).toBeUndefined();
      expect(petitionsData?.petitions).toEqual({
        totalCount: 3,
        items: expect.toIncludeSameMembers([
          {
            id: toGlobalId("Petition", user0Petition.id),
            permissions: [
              {
                permissionType: "OWNER",
                user: {
                  id: sessionUserGID,
                },
              },
            ],
          },
          {
            id: toGlobalId("Petition", user0Drafts[0].id),
            permissions: [
              {
                permissionType: "OWNER",
                user: {
                  id: sessionUserGID,
                },
              },
            ],
          },
          {
            id: toGlobalId("Petition", user0Drafts[1].id),
            permissions: [
              {
                permissionType: "OWNER",
                user: {
                  id: sessionUserGID,
                },
              },
            ],
          },
        ]),
      });
    });

    it("removes user from all their groups and deletes all petition permissions", async () => {
      // create a group, add user as member and share a petition with the group
      const [group] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(group.id, [activeUsers[0].id]);
      await mocks.sharePetitionWithGroups(user0Petition.id, [group.id]);

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
          transferToUserId: toGlobalId("User", activeUsers[2].id),
          includeDrafts: true,
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.deactivateUser).toEqual([
        {
          id: toGlobalId("User", activeUsers[0].id),
          status: "INACTIVE",
        },
      ]);

      const deactivatedUserPermissions = await mocks.knex
        .from<PetitionPermission>("petition_permission")
        .where("user_id", activeUsers[0].id)
        .whereNull("deleted_at")
        .select("*");
      expect(deactivatedUserPermissions).toHaveLength(0);

      const transferredUserDirectPermissions = await mocks.knex
        .from<PetitionPermission>("petition_permission")
        .where("user_id", activeUsers[2].id)
        .whereNull("deleted_at")
        .select(["petition_id", "type", "deleted_at"]);
      expect(transferredUserDirectPermissions).toIncludeSameMembers([
        {
          petition_id: user0Drafts[0].id,
          type: "OWNER",
          deleted_at: null,
        },
        {
          petition_id: user0Drafts[1].id,
          type: "OWNER",
          deleted_at: null,
        },
        {
          petition_id: user0Petition.id,
          type: "OWNER",
          deleted_at: null,
        },
      ]);

      const members = await mocks.knex
        .from("user_group_member")
        .where({ deleted_at: null, user_group_id: group.id });

      expect(members).toHaveLength(0);

      const templateDefaultPermissions = await mocks.knex
        .from("template_default_permission")
        .where("template_id", user1Template.id)
        .select("user_id", "template_id", "deleted_at");

      expect(templateDefaultPermissions).toIncludeSameMembers([
        {
          user_id: activeUsers[0].id,
          template_id: user1Template.id,
          deleted_at: expect.any(Date),
        },
        {
          user_id: activeUsers[2].id,
          template_id: user1Template.id,
          deleted_at: null,
        },
      ]);
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
          where petition_id in (?,?,?,?,?,?) and deleted_at is null
        `,
        [...user0Drafts.map((p) => p.id), user0Petition.id, ...user1Petitions.map((p) => p.id)],
      );

      expect(petitionUserPermissions).toIncludeSameMembers([
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

      expect(errors).toContainGraphQLError("USER_LIMIT_ERROR");
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

    it("transfers every user profile subscription", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
              status
            }
          }
        `,
        {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: toGlobalId("User", activeUsers[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.deactivateUser).toEqual([
        {
          id: toGlobalId("User", activeUsers[0].id),
          status: "INACTIVE",
        },
      ]);

      const profileSubscriptions = await mocks.knex
        .from("profile_subscription")
        .whereIn(
          "profile_id",
          profiles.map((p) => p.id),
        )
        .select("profile_id", "user_id", "deleted_at");

      expect(profileSubscriptions).toIncludeSameMembers(
        profiles.flatMap((profile) => [
          {
            profile_id: profile.id,
            user_id: activeUsers[0].id,
            deleted_at: expect.any(Date),
          },
          {
            profile_id: profile.id,
            user_id: activeUsers[2].id,
            deleted_at: null,
          },
        ]),
      );
    });

    it("transfers public link ownership", async () => {
      const [template] = await mocks.createRandomTemplates(organization.id, activeUsers[1].id);
      const publicLink = await mocks.createRandomPublicPetitionLink(template.id);
      await mocks.knex.from("template_default_permission").insert({
        user_id: activeUsers[1].id,
        template_id: template.id,
        type: "OWNER",
        is_subscribed: true,
      });

      const { errors } = await testClient.execute(
        gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
            }
          }
        `,
        {
          userIds: [toGlobalId("User", activeUsers[1].id)],
          transferToUserId: sessionUserGID,
        },
      );

      expect(errors).toBeUndefined();

      // make sure session user has access to template and its linked to public link
      const { errors: templateErrors, data: templateData } = await testClient.execute(
        gql`
          query ($id: GID!) {
            petition(id: $id) {
              id
              ... on PetitionTemplate {
                publicLink {
                  id
                }
              }
            }
          }
        `,
        {
          id: toGlobalId("Petition", template.id),
        },
      );

      expect(templateErrors).toBeUndefined();
      expect(templateData?.petition).toMatchObject({
        id: toGlobalId("Petition", template.id),
        publicLink: {
          id: toGlobalId("PublicPetitionLink", publicLink.id),
        },
      });

      const dbTemplateDefaultPermissions = await mocks.knex
        .from("template_default_permission")
        .where("template_id", template.id)
        .whereNull("deleted_at")
        .select("*");

      expect(dbTemplateDefaultPermissions).toHaveLength(1);
      expect(dbTemplateDefaultPermissions[0]).toMatchObject({
        user_id: sessionUser.id,
        type: "OWNER",
        is_subscribed: true,
        deleted_at: null,
      });
    });

    it("increases permission if the user to transfer to has a lower permission on the template than the user to deactivate", async () => {
      const [user1DefaultPermission] = await mocks.knex.from("template_default_permission").insert(
        {
          user_id: activeUsers[1].id,
          type: "READ",
          template_id: user1Template.id,
        },
        "*",
      );

      const { errors } = await testClient.execute(
        gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
            }
          }
        `,
        {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: toGlobalId("User", activeUsers[1].id),
        },
      );

      expect(errors).toBeUndefined();

      const [updatedDefaultPermission] = await mocks.knex
        .from("template_default_permission")
        .where("id", user1DefaultPermission.id)
        .select("*");

      expect(updatedDefaultPermission).toMatchObject({
        user_id: activeUsers[1].id,
        template_id: user1Template.id,
        type: "WRITE",
        deleted_at: null,
      });
    });

    it("maintains permission if the user to transfer to has a higher permission on the template than the user to deactivate", async () => {
      const [user1DefaultPermission] = await mocks.knex.from("template_default_permission").insert(
        {
          user_id: activeUsers[1].id,
          type: "OWNER",
          template_id: user1Template.id,
        },
        "*",
      );

      const { errors } = await testClient.execute(
        gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
            }
          }
        `,
        {
          userIds: [toGlobalId("User", activeUsers[0].id)],
          transferToUserId: toGlobalId("User", activeUsers[1].id),
        },
      );

      expect(errors).toBeUndefined();

      const [updatedDefaultPermission] = await mocks.knex
        .from("template_default_permission")
        .where("id", user1DefaultPermission.id)
        .select("*");

      expect(updatedDefaultPermission).toMatchObject({
        user_id: activeUsers[1].id,
        template_id: user1Template.id,
        type: "OWNER",
        deleted_at: null,
      });
    });

    it("increases permission if the user to transfer to has a lower petition permission on the template than the user to deactivate", async () => {
      const [user0Permission] = await mocks.knex.from("petition_permission").insert(
        {
          user_id: activeUsers[0].id,
          type: "WRITE",
          petition_id: user1Template.id,
        },
        "*",
      );

      const { errors } = await testClient.execute(
        gql`
          mutation ($userIds: [GID!]!, $transferToUserId: GID!) {
            deactivateUser(userIds: $userIds, transferToUserId: $transferToUserId) {
              id
            }
          }
        `,
        {
          userIds: [toGlobalId("User", activeUsers[1].id)],
          transferToUserId: toGlobalId("User", activeUsers[0].id),
        },
      );

      expect(errors).toBeUndefined();

      const [updatedPetitionPermission] = await mocks.knex
        .from("petition_permission")
        .where("id", user0Permission.id)
        .select("*");

      expect(updatedPetitionPermission).toMatchObject({
        user_id: activeUsers[0].id,
        petition_id: user1Template.id,
        type: "OWNER",
        deleted_at: null,
      });
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

      expect(errors).toContainGraphQLError("USER_ALREADY_IN_ORG_ERROR", {
        user: {
          id: toGlobalId("User", sessionUser.id),
          status: "ACTIVE",
          fullName: "Bond, James Bond",
        },
      });
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

  describe.skip("signUp", () => {
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
              petitionListViews {
                id
                name
                type
                isDefault
                data {
                  status
                  signature
                  fromTemplateId
                  path
                  search
                  searchIn
                  sharedWith {
                    __typename
                  }
                  tagsFilters {
                    __typename
                  }
                  sort {
                    __typename
                  }
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
            "TEAMS:READ_PERMISSIONS",
            "TEAMS:UPDATE_PERMISSIONS",
            "ORG_SETTINGS",
            "CONTACTS:DELETE_CONTACTS",
            "PETITIONS:SEND_ON_BEHALF",
            "PETITIONS:CHANGE_PATH",
            "PETITIONS:CREATE_TEMPLATES",
            "PETITIONS:LIST_PUBLIC_TEMPLATES",
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
                  "TEAMS:READ_PERMISSIONS",
                  "TEAMS:UPDATE_PERMISSIONS",
                  "ORG_SETTINGS",
                  "CONTACTS:DELETE_CONTACTS",
                  "PETITIONS:SEND_ON_BEHALF",
                  "PETITIONS:CHANGE_PATH",
                  "PETITIONS:CREATE_TEMPLATES",
                  "PETITIONS:LIST_PUBLIC_TEMPLATES",
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
          petitionListViews: [
            {
              id: expect.any(String),
              name: "ALL",
              type: "ALL",
              isDefault: false,
              data: {
                status: null,
                signature: null,
                fromTemplateId: null,
                path: "/",
                search: null,
                searchIn: "EVERYWHERE",
                sharedWith: null,
                tagsFilters: null,
                sort: null,
              },
            },
            {
              id: expect.any(String),
              name: "Ongoing",
              type: "CUSTOM",
              isDefault: false,
              data: {
                status: ["COMPLETED", "PENDING"],
                signature: null,
                fromTemplateId: null,
                path: "/",
                search: null,
                searchIn: "EVERYWHERE",
                sharedWith: null,
                tagsFilters: null,
                sort: null,
              },
            },
            {
              id: expect.any(String),
              name: "Closed",
              type: "CUSTOM",
              isDefault: false,
              data: {
                status: ["CLOSED"],
                signature: null,
                fromTemplateId: null,
                path: "/",
                search: null,
                searchIn: "EVERYWHERE",
                sharedWith: null,
                tagsFilters: null,
                sort: null,
              },
            },
            {
              id: expect.any(String),
              name: "Draft",
              type: "CUSTOM",
              isDefault: false,
              data: {
                status: ["DRAFT"],
                signature: null,
                fromTemplateId: null,
                path: "/",
                search: null,
                searchIn: "EVERYWHERE",
                sharedWith: null,
                tagsFilters: null,
                sort: null,
              },
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
                  id
                  name
                  pluralName
                  icon
                  profileNamePattern
                  isStandard
                  standardType
                  fields {
                    id
                    type
                    name
                    alias
                    isExpirable
                    expiryAlertAheadTime
                    options
                    position
                    isStandard
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
              id: expect.any(String),
              name: { en: "Individual", es: "Persona" },
              pluralName: { en: "Individuals", es: "Personas" },
              icon: "PERSON",
              isStandard: true,
              standardType: "INDIVIDUAL",
              profileNamePattern: `{{ ${profilesData.profileTypes.items[0].fields[0].id} }} {{ ${profilesData.profileTypes.items[0].fields[1].id} }}`,
              fields: [
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "First name", es: "Nombre" },
                  alias: "p_first_name",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 0,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Last name", es: "Apellido" },
                  alias: "p_last_name",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 1,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Email", es: "Correo electrónico" },
                  alias: "p_email",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { format: "EMAIL" },
                  position: 2,
                },
                {
                  id: expect.any(String),
                  type: "PHONE",
                  name: { en: "Phone number", es: "Número de teléfono" },
                  alias: "p_phone_number",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 3,
                },
                {
                  id: expect.any(String),
                  type: "PHONE",
                  name: { en: "Mobile phone number", es: "Número de teléfono móvil" },
                  alias: "p_mobile_phone_number",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 4,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: { en: "Date of birth", es: "Fecha de nacimiento" },
                  alias: "p_birth_date",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { useReplyAsExpiryDate: false },
                  position: 5,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Gender", es: "Género" },
                  alias: "p_gender",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      { value: "M", label: { en: "Male", es: "Hombre" }, isStandard: true },
                      { value: "F", label: { en: "Female", es: "Mujer" }, isStandard: true },
                    ],
                  },
                  position: 6,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Address", es: "Dirección" },
                  alias: "p_address",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 7,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "City", es: "Ciudad" },
                  alias: "p_city",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 8,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "ZIP code", es: "Código postal" },
                  alias: "p_zip",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 9,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Country of residence", es: "País de residencia" },
                  alias: "p_country_of_residence",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { values: expect.toBeArrayOfSize(250), standardList: "COUNTRIES" },
                  position: 10,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Proof of address document", es: "Documento de prueba de domicilio" },
                  alias: "p_proof_of_address_document",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 11,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Citizenship", es: "Nacionalidad" },
                  alias: "p_citizenship",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { values: expect.toBeArrayOfSize(250), standardList: "COUNTRIES" },
                  position: 12,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "ID number", es: "Número de identificación" },
                  alias: "p_tax_id",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 13,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "ID document", es: "Documento de identidad" },
                  alias: "p_id_document",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 14,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Passport", es: "Pasaporte" },
                  alias: "p_passport_document",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 15,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Passport number", es: "Número de pasaporte" },
                  alias: "p_passport_number",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 16,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Is PEP?", es: "¿Es PRP?" },
                  alias: "p_is_pep",
                  options: {
                    values: [
                      {
                        value: "Y",
                        label: { en: "Yes", es: "Si" },
                        isStandard: true,
                      },
                      {
                        value: "N",
                        label: { en: "No", es: "No" },
                        isStandard: true,
                      },
                    ],
                  },
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  position: 17,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Risk", es: "Riesgo" },
                  alias: "p_risk",
                  options: {
                    showOptionsWithColors: true,
                    values: [
                      {
                        color: "#FED7D7",
                        value: "HIGH",
                        label: { en: "High", es: "Alto" },
                        isStandard: true,
                      },
                      {
                        color: "#FEEBC8",
                        value: "MEDIUM_HIGH",
                        label: { en: "Medium-high", es: "Medio-alto" },
                        isStandard: true,
                      },
                      {
                        color: "#F5EFE8",
                        value: "MEDIUM",
                        label: { en: "Medium", es: "Medio" },
                        isStandard: true,
                      },
                      {
                        color: "#CEEDFF",
                        value: "MEDIUM_LOW",
                        label: { en: "Medium-low", es: "Medio-bajo" },
                        isStandard: true,
                      },
                      {
                        color: "#D5E7DE",
                        value: "LOW",
                        label: { en: "Low", es: "Bajo" },
                        isStandard: true,
                      },
                    ],
                  },
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  position: 18,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Risk assessment", es: "Evaluación de riesgo" },
                  alias: "p_risk_assessment",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 19,
                },
                {
                  id: expect.any(String),
                  type: "TEXT",
                  name: { en: "Source of funds", es: "Orígen de los fondos" },
                  alias: "p_source_of_funds",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 20,
                },
                {
                  id: expect.any(String),
                  type: "BACKGROUND_CHECK",
                  name: { en: "Background check", es: "Búsqueda en listados" },
                  alias: "p_background_check",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 21,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Occupation", es: "Ocupación" },
                  alias: "p_occupation",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 22,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Power of attorney", es: "Poder de representación" },
                  alias: "p_poa",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 23,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Position", es: "Cargo" },
                  alias: "p_position",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 24,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Client status", es: "Estado cliente" },
                  alias: "p_client_status",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        isStandard: true,
                        label: {
                          en: "Pending",
                          es: "Pendiente",
                        },
                        value: "PENDING",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Approved",
                          es: "Aprobado",
                        },
                        value: "APPROVED",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Rejected",
                          es: "Rechazado",
                        },
                        value: "REJECTED",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Active",
                          es: "Activo",
                        },
                        value: "ACTIVE",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Closed",
                          es: "Cerrado",
                        },
                        value: "CLOSED",
                      },
                    ],
                  },
                  position: 25,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Marital status", es: "Estado civil" },
                  alias: "p_marital_status",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        isStandard: true,
                        label: {
                          en: "Single",
                          es: "Soltero/a",
                        },
                        value: "SINGLE",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Married",
                          es: "Casado/a",
                        },
                        value: "MARRIED",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Widowed",
                          es: "Viudo/a",
                        },
                        value: "WIDOWED",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Divorced",
                          es: "Divorciado/a",
                        },
                        value: "DIVORCED",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Separated",
                          es: "Separado/a",
                        },
                        value: "SEPARATED",
                      },
                    ],
                  },
                  position: 26,
                },
                {
                  id: expect.any(String),
                  type: "CHECKBOX",
                  name: { en: "Relationship", es: "Relación" },
                  alias: "p_relationship",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        isStandard: true,
                        label: {
                          en: "Client",
                          es: "Cliente",
                        },
                        value: "CLIENT",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Provider",
                          es: "Proveedor",
                        },
                        value: "PROVIDER",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Other",
                          es: "Otros",
                        },
                        value: "OTHER",
                      },
                    ],
                  },
                  position: 27,
                },
              ],
            },
            {
              id: expect.any(String),
              name: { en: "Company", es: "Compañía" },
              pluralName: { en: "Companies", es: "Compañías" },
              icon: "BUILDING",
              isStandard: true,
              standardType: "LEGAL_ENTITY",
              profileNamePattern: `{{ ${profilesData.profileTypes.items[1].fields[0].id} }}`,
              fields: [
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Entity name", es: "Denominación social" },
                  alias: "p_entity_name",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 0,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Trade name", es: "Nombre comercial" },
                  alias: "p_trade_name",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 1,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Entity type", es: "Tipo de Entidad" },
                  alias: "p_entity_type",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        value: "LIMITED_LIABILITY_COMPANY",
                        label: {
                          en: "Limited Liability Company",
                          es: "Sociedad de Responsabilidad Limitada",
                        },
                        isStandard: true,
                      },
                      {
                        value: "INCORPORATED",
                        label: { en: "Incorporated", es: "Sociedad Anónima" },
                        isStandard: true,
                      },
                      {
                        value: "LIMITED_LIABILITY_PARTNERSHIP",
                        label: {
                          en: "Limited Liability Partnership",
                          es: "Sociedad Limitada Profesional",
                        },
                        isStandard: true,
                      },
                      {
                        value: "FOUNDATION",
                        label: { en: "Foundation", es: "Fundación" },
                        isStandard: true,
                      },
                      {
                        value: "ASSOCIATION",
                        label: { en: "Association", es: "Asociación" },
                        isStandard: true,
                      },
                      {
                        value: "TRUST",
                        label: { en: "Trust", es: "Trust" },
                        isStandard: true,
                      },
                      {
                        value: "OTHER",
                        label: { en: "Other", es: "Otro" },
                        isStandard: true,
                      },
                    ],
                  },
                  position: 2,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Registration number", es: "Número de registro" },
                  alias: "p_registration_number",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 3,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Tax ID", es: "Número de identificación fiscal" },
                  alias: "p_tax_id",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 4,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Registered address", es: "Domicilio social" },
                  alias: "p_registered_address",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 5,
                },
                {
                  id: expect.any(String),
                  type: "PHONE",
                  name: { en: "Phone number", es: "Teléfono" },
                  alias: "p_phone_number",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 6,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "City", es: "Ciudad" },
                  alias: "p_city",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 7,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "ZIP Code", es: "Código postal" },
                  alias: "p_zip",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 8,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Country", es: "País" },
                  alias: "p_country",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: expect.toBeArrayOfSize(250),
                    standardList: "COUNTRIES",
                  },
                  position: 9,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Country of incorporation", es: "País de constitución" },
                  alias: "p_country_of_incorporation",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: expect.toBeArrayOfSize(250),
                    standardList: "COUNTRIES",
                  },
                  position: 10,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: { en: "Date of incorporation", es: "Fecha de constitución" },
                  alias: "p_date_of_incorporation",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { useReplyAsExpiryDate: false },
                  position: 11,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Main business activity", es: "Actividad comercial principal" },
                  alias: "p_main_business_activity",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 12,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Ownership structure", es: "Estructura de propiedad" },
                  alias: "p_ownership_structure",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 13,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "UBO statement", es: "Acta de titularidad real" },
                  alias: "p_ubo_statement",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 14,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Financial statements", es: "Estados financieros" },
                  alias: "p_financial_statements",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 15,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Risk", es: "Riesgo" },
                  alias: "p_risk",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    showOptionsWithColors: true,
                    values: [
                      {
                        color: "#FED7D7",
                        value: "HIGH",
                        label: { en: "High", es: "Alto" },
                        isStandard: true,
                      },
                      {
                        color: "#FEEBC8",
                        value: "MEDIUM_HIGH",
                        label: { en: "Medium-high", es: "Medio-alto" },
                        isStandard: true,
                      },
                      {
                        color: "#F5EFE8",
                        value: "MEDIUM",
                        label: { en: "Medium", es: "Medio" },
                        isStandard: true,
                      },
                      {
                        color: "#CEEDFF",
                        value: "MEDIUM_LOW",
                        label: { en: "Medium-low", es: "Medio-bajo" },
                        isStandard: true,
                      },
                      {
                        color: "#D5E7DE",
                        value: "LOW",
                        label: { en: "Low", es: "Bajo" },
                        isStandard: true,
                      },
                    ],
                  },
                  position: 16,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Risk assessment", es: "Evaluación de riesgo" },
                  alias: "p_risk_assessment",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 17,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Power of attorney types", es: "Tipos de Poderes" },
                  alias: "p_poa_types",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        value: "GENERAL_POA",
                        label: { en: "General power of attorney", es: "Poder general" },
                        isStandard: true,
                      },
                      {
                        value: "SPECIAL_POA",
                        label: { en: "Special power of attorney", es: "Poder especial" },
                        isStandard: true,
                      },
                    ],
                  },
                  position: 18,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Power of attorney scope", es: "Alcance del Poder" },
                  alias: "p_poa_scope",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 19,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: {
                    en: "Power of attorney document",
                    es: "Documento del poder de representación",
                  },
                  alias: "p_poa_document",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 20,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: {
                    en: "Effective date of power of attorney",
                    es: "Fecha de inicio del poder",
                  },
                  alias: "p_poa_effective_date",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    useReplyAsExpiryDate: false,
                  },
                  position: 21,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: {
                    en: "Expiration date of power of attorney",
                    es: "Fecha de vencimiento del poder",
                  },
                  alias: "p_poa_expiration_date",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    useReplyAsExpiryDate: false,
                  },
                  position: 22,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Revocation conditions", es: "Condiciones de revocación" },
                  alias: "p_poa_revocation_conditions",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 23,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: {
                    en: "Registered power of attorney",
                    es: "Poder de representación registrado",
                  },
                  alias: "p_poa_registered",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        value: "Y",
                        label: { en: "Yes", es: "Si" },
                        isStandard: true,
                      },
                      {
                        value: "N",
                        label: { en: "No", es: "No" },
                        isStandard: true,
                      },
                    ],
                  },
                  position: 24,
                },
                {
                  id: expect.any(String),
                  type: "BACKGROUND_CHECK",
                  name: {
                    en: "Background check",
                    es: "Búsqueda en listados",
                  },
                  alias: "p_background_check",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 25,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: {
                    en: "Tax identification document",
                    es: "Código de identificación fiscal (documento)",
                  },
                  alias: "p_tax_id_document",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 26,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: {
                    en: "Deed of incorporation",
                    es: "Escritura de constitución",
                  },
                  alias: "p_deed_incorporation",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 27,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: {
                    en: "Bylaws",
                    es: "Estatutos sociales",
                  },
                  alias: "p_bylaws",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 28,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: {
                    en: "Client status",
                    es: "Estado cliente",
                  },
                  alias: "p_client_status",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        value: "PENDING",
                        label: { en: "Pending", es: "Pendiente" },
                        isStandard: true,
                      },
                      {
                        value: "APPROVED",
                        label: { en: "Approved", es: "Aprobado" },
                        isStandard: true,
                      },
                      {
                        value: "REJECTED",
                        label: { en: "Rejected", es: "Rechazado" },
                        isStandard: true,
                      },
                      {
                        value: "ACTIVE",
                        label: { en: "Active", es: "Activo" },
                        isStandard: true,
                      },
                      {
                        value: "CLOSED",
                        label: { en: "Closed", es: "Cerrado" },
                        isStandard: true,
                      },
                    ],
                  },
                  position: 29,
                },
                {
                  id: expect.any(String),
                  type: "CHECKBOX",
                  name: {
                    en: "Relationship",
                    es: "Relación",
                  },
                  alias: "p_relationship",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        value: "CLIENT",
                        label: {
                          en: "Client",
                          es: "Cliente",
                        },
                        isStandard: true,
                      },
                      {
                        value: "PROVIDER",
                        label: {
                          en: "Provider",
                          es: "Proveedor",
                        },
                        isStandard: true,
                      },
                      {
                        value: "OTHER",
                        label: {
                          en: "Other",
                          es: "Otros",
                        },
                        isStandard: true,
                      },
                    ],
                  },
                  position: 30,
                },
              ],
            },
            {
              id: expect.any(String),
              name: { en: "Contract", es: "Contrato" },
              pluralName: { en: "Contracts", es: "Contratos" },
              icon: "DOCUMENT",
              isStandard: true,
              standardType: "CONTRACT",
              profileNamePattern: `{{ ${profilesData.profileTypes.items[2].fields[0].id} }} - {{ ${profilesData.profileTypes.items[2].fields[1].id} }}`,
              fields: [
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Counterparty", es: "Contraparte" },
                  alias: "p_counterparty",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 0,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Contract type", es: "Tipo de contrato" },
                  alias: "p_contract_type",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        value: "SERVICE_AGREEMENT",
                        label: { en: "Service agreement", es: "Contrato de servicios" },
                        isStandard: true,
                      },
                      {
                        value: "EMPLOYMENT_CONTRACT",
                        label: { en: "Employment contract", es: "Contrato de trabajo" },
                        isStandard: true,
                      },
                      {
                        value: "LEASE_AGREEMENT",
                        label: { en: "Lease agreement", es: "Contrato de arrendamiento" },
                        isStandard: true,
                      },
                      {
                        value: "SALES_CONTRACT",
                        label: { en: "Sales contract", es: "Contrato de venta" },
                        isStandard: true,
                      },
                      {
                        value: "NDA",
                        label: {
                          en: "Non-Disclosure Agreement (NDA)",
                          es: "Acuerdo de confidencialidad (NDA)",
                        },
                        isStandard: true,
                      },
                      {
                        value: "PARTNERSHIP_AGREEMENT",
                        label: { en: "Partnership agreement", es: "Contrato de colaboración" },
                        isStandard: true,
                      },
                      {
                        value: "SUPPLY_CONTRACT",
                        label: { en: "Supply contract", es: "Contrato de suministro" },
                        isStandard: true,
                      },
                      {
                        value: "CONSULTING_AGREEMENT",
                        label: { en: "Consulting agreement", es: "Contrato de consultoría" },
                        isStandard: true,
                      },
                      {
                        value: "SOFTWARE_DEVELOPMENT_AGREEMENT",
                        label: {
                          en: "Software development agreement",
                          es: "Contrato de desarrollo de software",
                        },
                        isStandard: true,
                      },
                      {
                        value: "PURCHASE_ORDER",
                        label: { en: "Purchase order", es: "Orden de compra" },
                        isStandard: true,
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Software as a Service agreement (SaaS)",
                          es: "Contrato de Software como Servicio (SaaS)",
                        },
                        value: "SAAS",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Data protection agreement (DPA)",
                          es: "Acuerdo de protección de datos (DPA)",
                        },
                        value: "DPA",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Loan agreement",
                          es: "Acuerdo de préstamo",
                        },
                        value: "LOAN",
                      },
                      {
                        isStandard: true,
                        label: {
                          en: "Credit facility",
                          es: "Línea de crédito",
                        },
                        value: "CREDIT",
                      },
                    ],
                  },
                  position: 1,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: { en: "Effective date", es: "Fecha de inicio" },
                  alias: "p_effective_date",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: { useReplyAsExpiryDate: false },
                  position: 2,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: { en: "Expiration date", es: "Fecha de vencimiento" },
                  alias: "p_expiration_date",
                  isStandard: true,
                  isExpirable: true,
                  expiryAlertAheadTime: { months: 1 },
                  options: { useReplyAsExpiryDate: true },
                  position: 3,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Jurisdiction", es: "Jurisdicción" },
                  alias: "p_jurisdiction",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: expect.toBeArrayOfSize(250),
                    standardList: "COUNTRIES",
                  },
                  position: 4,
                },
                {
                  id: expect.any(String),
                  type: "NUMBER",
                  name: { en: "Contract value", es: "Valor del contrato" },
                  alias: "p_contract_value",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 5,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Currency", es: "Moneda" },
                  alias: "p_contract_currency",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: expect.toBeArrayOfSize(155),
                    standardList: "CURRENCIES",
                  },
                  position: 6,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Payment terms", es: "Términos de pago" },
                  alias: "p_payment_terms",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 7,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Renewal terms", es: "Términos de renovación" },
                  alias: "p_renewal_terms",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 8,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Original document", es: "Documento original" },
                  alias: "p_original_document",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 9,
                },
                {
                  id: expect.any(String),
                  type: "FILE",
                  name: { en: "Amendments", es: "Enmiendas" },
                  alias: "p_amendments",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 10,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Termination clauses", es: "Cláusulas de terminación" },
                  alias: "p_termination_clauses",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 11,
                },
                {
                  id: expect.any(String),
                  type: "SELECT",
                  name: { en: "Confidentiality agreement", es: "Acuerdo de confidencialidad" },
                  alias: "p_confidentiality_agreement",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    values: [
                      {
                        value: "Y",
                        label: { en: "Yes", es: "Si" },
                        isStandard: true,
                      },
                      {
                        value: "N",
                        label: { en: "No", es: "No" },
                        isStandard: true,
                      },
                    ],
                  },
                  position: 12,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: { en: "Performance metrics", es: "Métricas de desempeño" },
                  alias: "p_performance_metrics",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 13,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: {
                    en: "Dispute resolution mechanism",
                    es: "Mecanismo de resolución de disputas",
                  },
                  alias: "p_dispute_resolution_mechanism",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 14,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: {
                    en: "Compliance obligations",
                    es: "Obligaciones de cumplimiento",
                  },
                  alias: "p_compliance_obligations",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 15,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: {
                    en: "Security provisions",
                    es: "Provisiones de seguridad",
                  },
                  alias: "p_security_provisions",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 16,
                },
                {
                  id: expect.any(String),
                  type: "TEXT",
                  name: {
                    en: "Notes",
                    es: "Notas",
                  },
                  alias: "p_notes",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 17,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: {
                    en: "Billing contact full name",
                    es: "Nombre completo del contacto de facturación",
                  },
                  alias: "p_billing_contact_full_name",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 18,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: {
                    en: "Billing contact email",
                    es: "Correo electrónico del contacto de facturación",
                  },
                  alias: "p_billing_contact_email",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    format: "EMAIL",
                  },
                  position: 19,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: {
                    en: "Legal contact full name",
                    es: "Nombre completo del contacto de legal",
                  },
                  alias: "p_legal_contact_full_name",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {},
                  position: 20,
                },
                {
                  id: expect.any(String),
                  type: "SHORT_TEXT",
                  name: {
                    en: "Legal contact email",
                    es: "Correo electrónico del contacto de legal",
                  },
                  alias: "p_legal_contact_email",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    format: "EMAIL",
                  },
                  position: 21,
                },
                {
                  id: expect.any(String),
                  type: "DATE",
                  name: {
                    en: "Signature date",
                    es: "Fecha de firma",
                  },
                  alias: "p_signature_date",
                  isStandard: true,
                  isExpirable: false,
                  expiryAlertAheadTime: null,
                  options: {
                    useReplyAsExpiryDate: false,
                  },
                  position: 22,
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

      const userId = fromGlobalId(data!.signUp.id, "User").id;
      const dbProfileListViews = await mocks.knex
        .from("profile_list_view")
        .where("user_id", userId)
        .select("*");

      expect(dbProfileListViews).toHaveLength(3);
      const profileTypes = (profilesData.profileTypes.items as any[]).map((pt) => {
        const fields =
          pt.standardType === "INDIVIDUAL" || pt.standardType === "LEGAL_ENTITY"
            ? ["p_client_status", "p_risk", "p_relationship"]
            : ["p_signature_date", "p_expiration_date"];
        return {
          id: fromGlobalId(pt.id, "ProfileType").id,
          columns: fields
            .map(
              (alias) =>
                `field_${
                  fromGlobalId(
                    pt.fields.find((ptf: any) => ptf.alias === alias)!.id,
                    "ProfileTypeField",
                  ).id
                }`,
            )
            .concat("subscribers", "createdAt"),
        };
      });

      expect(dbProfileListViews).toIncludeSameMembers(
        profileTypes.map((pt) => ({
          id: expect.any(Number),
          user_id: userId,
          profile_type_id: pt.id,
          name: "ALL",
          data: {
            columns: pt.columns,
            sort: null,
            search: null,
            status: null,
          },
          position: 0,
          view_type: "ALL",
          is_default: false,
          created_at: expect.any(Date),
          created_by: `User:${userId}`,
          updated_at: expect.any(Date),
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
        })),
      );
    });
  });
});
