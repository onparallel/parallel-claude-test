import { initServer, TestClient } from "./server";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, PetitionUser, User } from "../../db/__types";
import { userCognitoId } from "./mocks";
import { toGlobalId } from "../../util/globalId";
import gql from "graphql-tag";
import { KNEX } from "../../db/knex";
import Knex from "knex";

describe("GraphQL/Users", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let organization: Organization;
  let sessionUser: User;
  let sessionUserGID: string;

  beforeAll(async (done) => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));

    [sessionUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: userCognitoId,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
      organization_role: "ADMIN",
    }));

    sessionUserGID = toGlobalId("User", sessionUser.id);
    done();
  });

  afterAll(async (done) => {
    await testClient.stop();
    done();
  });

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

  it("changes user name", async () => {
    const { errors, data } = await testClient.mutate({
      mutation: gql`
        mutation($userId: GID!, $firstName: String, $lastName: String) {
          updateUser(
            id: $userId
            data: { firstName: $firstName, lastName: $lastName }
          ) {
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

  describe("updateUserStatus", () => {
    let activeUsers: User[];
    let inactiveUser: User;
    let user0Petition: Petition;
    let user1Petitions: Petition[];

    let otherOrg: Organization;
    let otherOrgUser: User;

    beforeEach(async (done) => {
      activeUsers = await mocks.createRandomUsers(organization.id, 3, () => ({
        status: "ACTIVE",
      }));

      [inactiveUser] = await mocks.createRandomUsers(
        organization.id,
        1,
        () => ({
          status: "INACTIVE",
        })
      );

      [user0Petition] = await mocks.createRandomPetitions(
        organization.id,
        activeUsers[0].id,
        1
      );

      user1Petitions = await mocks.createRandomPetitions(
        organization.id,
        activeUsers[1].id,
        3
      );

      [otherOrg] = await mocks.createRandomOrganizations(1);
      [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1, () => ({
        status: "ACTIVE",
      }));

      done();
    });

    it("updates user status to inactive and transfers petition to session user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $userIds: [GID!]!
            $status: UserStatus!
            $transferToUserId: GID
          ) {
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
      const {
        errors: petitionErrors,
        data: petitionData,
      } = await testClient.query({
        query: gql`
          query petition($id: GID!) {
            petition(id: $id) {
              id
              userPermissions {
                permissionType
                user {
                  id
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
      expect(petitionData.petition).toEqual({
        id: toGlobalId("Petition", user0Petition.id),
        userPermissions: [
          {
            permissionType: "OWNER",
            user: {
              id: sessionUserGID,
            },
          },
        ],
      });
    });

    it("updates user status to active without specifying transferToUserId argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($userIds: [GID!]!, $status: UserStatus!) {
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
          mutation(
            $userIds: [GID!]!
            $status: UserStatus!
            $transferToUserId: GID
          ) {
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
          userIds: [
            toGlobalId("User", activeUsers[0].id),
            toGlobalId("User", activeUsers[1].id),
          ],
          status: "INACTIVE",
          transferToUserId: toGlobalId("User", activeUsers[2].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data.updateUserStatus).toEqual([
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
        select petition_id, permission_type, user_id, updated_by 
        from petition_user 
        where petition_id in (?,?,?,?) and deleted_at is null`,
        [user0Petition.id, ...user1Petitions.map((p) => p.id)]
      );

      expect(petitionUserPermissions).toEqual([
        {
          petition_id: user0Petition.id,
          permission_type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
        {
          petition_id: user1Petitions[0].id,
          permission_type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
        {
          petition_id: user1Petitions[1].id,
          permission_type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
        {
          petition_id: user1Petitions[2].id,
          permission_type: "OWNER",
          user_id: activeUsers[2].id,
          updated_by: `User:${sessionUser.id}`,
        },
      ]);
    });

    it("sends error when trying to update status of a user in another organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($userIds: [GID!]!, $status: UserStatus!) {
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
          mutation(
            $userIds: [GID!]!
            $status: UserStatus!
            $transferToUserId: GID
          ) {
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to transfer petitions to a user in another organization", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $userIds: [GID!]!
            $status: UserStatus!
            $transferToUserId: GID
          ) {
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

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to set status to inactive without specifying transferToUserId argument", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($userIds: [GID!]!, $status: UserStatus!) {
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
          mutation($userIds: [GID!]!, $status: UserStatus!) {
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
          mutation(
            $userIds: [GID!]!
            $status: UserStatus!
            $transferToUserId: GID
          ) {
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
});
