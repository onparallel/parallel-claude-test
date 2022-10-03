import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  PetitionPermission,
  PetitionPermissionTypeValues,
  User,
  UserGroup,
} from "../../db/__types";
import { EMAILS, IEmailsService } from "../../services/emails";
import { toGlobalId } from "../../util/globalId";
import { Maybe, MaybeArray } from "../../util/types";
import { initServer, TestClient } from "./server";

describe("GraphQL/Petition Permissions", () => {
  let testClient: TestClient;
  let organization: Organization;
  let loggedUser: User;
  let orgUsers: User[];
  let otherOrgUser: User;
  let mocks: Mocks;

  let userPetition: Petition;
  let readPetition: Petition;
  let otherPetition: Petition;
  let userGroup: UserGroup;
  let userGroupMembers: User[];

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user: loggedUser } = await mocks.createSessionUserAndOrganization());

    const [otherOrg] = await mocks.createRandomOrganizations(1);

    orgUsers = await mocks.createRandomUsers(organization.id, 3);
    [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1);
  });

  beforeEach(async () => {
    [userPetition, readPetition] = await mocks.createRandomPetitions(
      organization.id,
      loggedUser.id,
      2,
      undefined,
      (i) => ({
        type: i === 0 ? "OWNER" : "READ",
      })
    );
    [otherPetition] = await mocks.createRandomPetitions(organization.id, orgUsers[1].id, 1);

    [userGroup] = await mocks.createUserGroups(1, organization.id);
    userGroupMembers = await mocks.createRandomUsers(organization.id, 2);
    await mocks.insertUserGroupMembers(userGroup.id, [
      loggedUser.id,
      userGroupMembers[0].id,
      userGroupMembers[1].id,
    ]);
    await mocks.sharePetitionWithGroups(userPetition.id, [userGroup.id]);
  });

  afterEach(async () => {
    await mocks.clearSharedPetitions();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("PetitionPermissionType", () => {
    it("ensures correct order of types", () => {
      // PetitionPermissionType enum in db must be in the right order
      // (OWNER > WRITE > READ)
      expect(PetitionPermissionTypeValues).toHaveLength(3);
      const ownerIndex = PetitionPermissionTypeValues.indexOf("OWNER");
      const writeIndex = PetitionPermissionTypeValues.indexOf("WRITE");
      const readIndex = PetitionPermissionTypeValues.indexOf("READ");

      expect(ownerIndex < writeIndex && ownerIndex < readIndex);
      expect(writeIndex > ownerIndex && writeIndex < readIndex);
      expect(readIndex > ownerIndex && readIndex > writeIndex);
    });
  });

  describe("queries", () => {
    it("queries user and group permissions on a petition", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        permissions: [
          {
            permissionType: "OWNER",
            user: { id: toGlobalId("User", loggedUser.id) },
          },
          {
            permissionType: "WRITE",
            group: { id: toGlobalId("UserGroup", userGroup.id) },
          },
        ],
      });
    });

    it("queries the effective user permissions on a petition", async () => {
      const { errors, data } = await testClient.query({
        query: gql`
          query ($petitionId: GID!) {
            petition(id: $petitionId) {
              myEffectivePermission {
                permissionType
                isSubscribed
              }
            }
          }
        `,
        variables: {
          petitionId: toGlobalId("Petition", userPetition.id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.petition).toEqual({
        myEffectivePermission: {
          permissionType: "OWNER",
          isSubscribed: true,
        },
      });
    });
  });

  describe("transferPetitionOwnership", () => {
    it("transfers ownership of a petition to given user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
              id

              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          ids: [toGlobalId("Petition", userPetition.id)],
          userId: toGlobalId("User", orgUsers[0].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.transferPetitionOwnership).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", orgUsers[0].id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
          ],
        },
      ]);
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
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
          ids: [toGlobalId("Petition", otherPetition.id)],
          userId: toGlobalId("User", orgUsers[0].id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user shares petition to a user from another org", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
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
          ids: [toGlobalId("Petition", userPetition.id)],
          userId: toGlobalId("User", otherOrgUser.id),
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing empty array", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
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
          ids: [],
          userId: toGlobalId("User", loggedUser.id),
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("transfers ownership of a petition to a user with group permission", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          ids: [toGlobalId("Petition", userPetition.id)],
          userId: toGlobalId("User", userGroupMembers[0].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.transferPetitionOwnership).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", userGroupMembers[0].id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
          ],
        },
      ]);
    });
  });

  describe("addPetitionPermission", () => {
    it("sends error when trying to share petition with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: WRITE
            ) {
              id
            }
          }
        `,
        {
          petitionIds: [toGlobalId("Petition", readPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id)],
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("creates an event when sharing petition with new group", async () => {
      const [group] = await mocks.createUserGroups(1, organization.id);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userGroupIds: [GID!]!
            $type: PetitionPermissionTypeRW!
          ) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              permissionType: $type
              notify: false
              message: "hello!"
            ) {
              id
              ... on Petition {
                events(limit: 1000, offset: 0) {
                  totalCount
                  items {
                    __typename
                    ... on GroupPermissionAddedEvent {
                      permissionType
                      permissionGroup {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", group.id)],
          type: "READ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          events: {
            totalCount: 1,
            items: [
              {
                __typename: "GroupPermissionAddedEvent",
                permissionType: "READ",
                permissionGroup: { id: toGlobalId("UserGroup", group.id) },
              },
            ],
          },
        },
      ]);
    });

    it("adds new permissions on a given petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
              message: "hello!"
            ) {
              id

              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[0].id) },
            },
          ],
        },
      ]);
    });

    it("upgrades permissions from READ to WRITE adding permissions", async () => {
      await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
              message: "hello!"
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
              message: "hello!"
            ) {
              id

              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "WRITE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", orgUsers[0].id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
          ],
        },
      ]);
    });

    it("try to downgrade from WRITE to READ adding permissions", async () => {
      await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
              message: "hello!"
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "WRITE",
        },
      });

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
              message: "hello!"
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", orgUsers[0].id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
          ],
        },
      ]);
    });

    it("sends notification email to users after adding permissions", async () => {
      const sendPetitionSharedEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharedEmail"
      );

      await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[2].id)],
          type: "READ",
        },
      });

      expect(sendPetitionSharedEmailSpy).toHaveBeenCalledTimes(1);
    });

    it("doesn't send notification email to users if notify arg is false or undefined", async () => {
      const sendPetitionSharedEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharedEmail"
      );

      await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      expect(sendPetitionSharedEmailSpy).toHaveBeenCalledTimes(0);
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", otherPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user shares petition to a user from another org", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", otherOrgUser.id)],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing empty arrays as arguments", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [],
          userIds: [],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("should send notification email only to users that didn't have previous permissions", async () => {
      const sendPetitionSharedEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharedEmail"
      );
      const [newUser] = await mocks.createRandomUsers(organization.id, 1);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
            ) {
              id

              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", userGroupMembers[0].id), toGlobalId("User", newUser.id)],
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", userGroupMembers[0].id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", newUser.id) },
            },
          ],
        },
      ]);

      const [permission] = await mocks.knex<PetitionPermission>("petition_permission").where({
        petition_id: userPetition.id,
        user_id: newUser.id,
        deleted_at: null,
        from_user_group_id: null,
      });

      expect(sendPetitionSharedEmailSpy).toHaveBeenLastCalledWith<
        [number, MaybeArray<number>, Maybe<string>]
      >(loggedUser.id, [permission.id], null);
    });

    it("notifies only once per user and petition", async () => {
      const sendPetitionSharedEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharedEmail"
      );

      const [newUser] = await mocks.createRandomUsers(organization.id, 1);
      const [newGroup] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(newGroup.id, [newUser.id]);

      const { errors } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $userGroupIds: [GID!]!
            $type: PetitionPermissionTypeRW!
          ) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              userGroupIds: $userGroupIds
              permissionType: $type
              notify: true
            ) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", newUser.id)],
          userGroupIds: [toGlobalId("UserGroup", newGroup.id)],
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();

      const [permission] = await mocks.knex<PetitionPermission>("petition_permission").where({
        petition_id: userPetition.id,
        user_id: newUser.id,
        deleted_at: null,
        from_user_group_id: null,
      });

      expect(sendPetitionSharedEmailSpy).toHaveBeenLastCalledWith<
        [number, MaybeArray<number>, Maybe<string>]
      >(loggedUser.id, [permission.id], null);
    });

    it("should not send notification to user with previous permissions", async () => {
      const sendPetitionSharedEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharedEmail"
      );
      const [newGroup] = await mocks.createUserGroups(1, organization.id);
      const [newUser] = await mocks.createRandomUsers(organization.id, 1);
      await mocks.insertUserGroupMembers(newGroup.id, [newUser.id]);
      await mocks.sharePetitionWithGroups(userPetition.id, [newGroup.id]);

      const { errors } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionTypeRW!) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
            ) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", newUser.id)],
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();
      expect(sendPetitionSharedEmailSpy).toHaveBeenCalledTimes(0);
    });

    it("notifies group members when sharing a petition with a group", async () => {
      const sendPetitionSharedEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharedEmail"
      );

      const [newGroup] = await mocks.createUserGroups(1, organization.id);
      const [newUser] = await mocks.createRandomUsers(organization.id, 1);
      await mocks.insertUserGroupMembers(newGroup.id, [newUser.id]);

      const { errors } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userGroupIds: [GID!]!
            $type: PetitionPermissionTypeRW!
          ) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              permissionType: $type
              notify: true
            ) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", newGroup.id)],
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();

      const [permission] = await mocks.knex<PetitionPermission>("petition_permission").where({
        petition_id: userPetition.id,
        user_id: newUser.id,
        from_user_group_id: newGroup.id,
        deleted_at: null,
      });

      expect(sendPetitionSharedEmailSpy).toHaveBeenLastCalledWith<
        [number, MaybeArray<number>, Maybe<string>]
      >(loggedUser.id, [permission.id], null);
    });

    it("shares a petition with a group", async () => {
      const [newGroup] = await mocks.createUserGroups(1, organization.id);
      await mocks.insertUserGroupMembers(newGroup.id, [loggedUser.id]);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userGroupIds: [GID!]!
            $type: PetitionPermissionTypeRW!
          ) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              permissionType: $type
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", newGroup.id)],
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
            {
              permissionType: "READ",
              group: { id: toGlobalId("UserGroup", newGroup.id) },
            },
          ],
        },
      ]);
    });

    it("shares petition with multiple groups", async () => {
      const groups = await mocks.createUserGroups(2, organization.id);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userGroupIds: [GID!]!
            $type: PetitionPermissionTypeRW!
          ) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              permissionType: $type
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [userGroup, ...groups].map((g) => toGlobalId("UserGroup", g.id)),
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
            ...groups.map((g) => ({
              permissionType: "READ",
              group: { id: toGlobalId("UserGroup", g.id) },
            })),
          ],
        },
      ]);
    });

    it("shares petition with multiple groups and users", async () => {
      const groups = await mocks.createUserGroups(2, organization.id);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userGroupIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionPermissionTypeRW!
          ) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              userIds: $userIds
              permissionType: $type
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [userGroup, ...groups].map((g) => toGlobalId("UserGroup", g.id)),
          userIds: userGroupMembers.map((m) => toGlobalId("User", m.id)),
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
            ...userGroupMembers.map((u) => ({
              permissionType: "READ",
              user: { id: toGlobalId("User", u.id) },
            })),
            ...groups.map((g) => ({
              permissionType: "READ",
              group: { id: toGlobalId("UserGroup", g.id) },
            })),
          ],
        },
      ]);
    });

    it("creates user and group events when sharing petition", async () => {
      const groups = await mocks.createUserGroups(2, organization.id);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userGroupIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionPermissionTypeRW!
          ) {
            addPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              userIds: $userIds
              permissionType: $type
            ) {
              id
              ... on Petition {
                events(limit: 1000, offset: 0) {
                  totalCount
                  items {
                    __typename
                    ... on GroupPermissionAddedEvent {
                      permissionType
                      permissionGroup {
                        id
                      }
                    }
                    ... on UserPermissionAddedEvent {
                      permissionType
                      permissionUser {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [userGroup, ...groups].map((g) => toGlobalId("UserGroup", g.id)),
          userIds: userGroupMembers.map((m) => toGlobalId("User", m.id)),
          type: "READ",
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.addPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          events: {
            totalCount: 4,
            items: [
              ...groups.reverse().map((g) => ({
                __typename: "GroupPermissionAddedEvent",
                permissionType: "READ",
                permissionGroup: { id: toGlobalId("UserGroup", g.id) },
              })),
              ...userGroupMembers.reverse().map((u) => ({
                __typename: "UserPermissionAddedEvent",
                permissionType: "READ",
                permissionUser: { id: toGlobalId("User", u.id) },
              })),
            ],
          },
        },
      ]);
    });
  });

  describe("editPetitionPermission", () => {
    beforeEach(async () => {
      await mocks.sharePetitions([userPetition.id], orgUsers[1].id, "WRITE");
      await mocks.sharePetitions([userPetition.id], orgUsers[2].id, "WRITE");
      await mocks.sharePetitions([readPetition.id], orgUsers[2].id, "WRITE");
    });

    afterEach(async () => {
      await mocks.clearSharedPetitions();
    });

    it("sends error when trying to edit permissions with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
              id
            }
          }
        `,
        {
          petitionIds: [toGlobalId("Petition", readPetition.id)],
          userIds: [toGlobalId("UserGroup", orgUsers[2].id)],
          type: "READ",
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("changes petition permissions on a group", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userGroupIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              permissionType: $type
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
          type: "READ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.editPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", orgUsers[1].id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", orgUsers[2].id) },
            },
            {
              permissionType: "READ",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
          ],
        },
      ]);
    });

    it("creates group event when editing petition permissions on a group", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userGroupIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              permissionType: $type
            ) {
              id
              events(limit: 1000, offset: 0) {
                totalCount
                items {
                  __typename
                  ... on GroupPermissionEditedEvent {
                    permissionType
                    permissionGroup {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
          type: "READ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.editPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          events: {
            totalCount: 1,
            items: [
              {
                __typename: "GroupPermissionEditedEvent",
                permissionType: "READ",
                permissionGroup: { id: toGlobalId("UserGroup", userGroup.id) },
              },
            ],
          },
        },
      ]);
    });

    it("changes petition permissions on multiple groups and users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation (
            $petitionIds: [GID!]!
            $userGroupIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionPermissionType!
          ) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userGroupIds: $userGroupIds
              userIds: $userIds
              permissionType: $type
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
          userIds: [toGlobalId("User", orgUsers[2].id)],
          type: "READ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.editPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", orgUsers[1].id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[2].id) },
            },
            {
              permissionType: "READ",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
          ],
        },
      ]);
    });

    it("changes permission type for given set of petitions and users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
              id

              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id), toGlobalId("User", orgUsers[2].id)],
          type: "WRITE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.editPetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", orgUsers[1].id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", orgUsers[2].id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
          ],
        },
      ]);
    });

    it("sends error if user sets more than one owner", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id), toGlobalId("User", orgUsers[2].id)],
          type: "OWNER",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", otherPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id)],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user shares petition to a user from another org", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", otherOrgUser.id)],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing empty arrays as arguments", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $type: PetitionPermissionType!) {
            editPetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [],
          userIds: [],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("removePetitionPermission", () => {
    beforeEach(async () => {
      await mocks.sharePetitions([userPetition.id], orgUsers[1].id, "READ");
      await mocks.sharePetitions([userPetition.id], orgUsers[2].id, "READ");
      await mocks.sharePetitions([readPetition.id], orgUsers[2].id, "WRITE");
    });

    afterEach(async () => {
      await mocks.clearSharedPetitions();
    });

    it("sends error when trying to remove permissions with READ access", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds, userIds: $userIds) {
              id
            }
          }
        `,
        {
          petitionIds: [toGlobalId("Petition", readPetition.id)],
          userIds: [toGlobalId("User", orgUsers[2].id)],
        }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("removes permissions for given set of petitions and users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds, userIds: $userIds) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.removePetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[2].id) },
            },
          ],
        },
      ]);
    });

    it("removes permissions on multiple groups and users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $userGroupIds: [GID!]!) {
            removePetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              userGroupIds: $userGroupIds
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.removePetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[2].id) },
            },
          ],
        },
      ]);
    });

    it("should be able to delete owned petition after removing all permissions", async () => {
      const { errors: removeErrors, data: removeData } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $userGroupIds: [GID!]!) {
            removePetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              userGroupIds: $userGroupIds
            ) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id), toGlobalId("User", orgUsers[2].id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
        },
      });

      expect(removeErrors).toBeUndefined();
      expect(removeData!.removePetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
          ],
        },
      ]);

      const { errors: deleteErrors, data: deleteData } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            deletePetitions(ids: $petitionIds)
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
        },
      });

      expect(deleteErrors).toBeUndefined();
      expect(deleteData!.deletePetitions).toEqual("SUCCESS");
    });

    it("creates events when removing permissions on multiple groups and users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!, $userGroupIds: [GID!]!) {
            removePetitionPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              userGroupIds: $userGroupIds
            ) {
              id
              ... on Petition {
                events(limit: 1000, offset: 0) {
                  totalCount
                  items {
                    __typename
                    ... on UserPermissionRemovedEvent {
                      permissionUser {
                        id
                      }
                    }
                    ... on GroupPermissionRemovedEvent {
                      permissionGroup {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.removePetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          events: {
            totalCount: 2,
            items: [
              {
                __typename: "GroupPermissionRemovedEvent",
                permissionGroup: { id: toGlobalId("UserGroup", userGroup.id) },
              },
              {
                __typename: "UserPermissionRemovedEvent",
                permissionUser: { id: toGlobalId("User", orgUsers[1].id) },
              },
            ],
          },
        },
      ]);
    });

    it("removes all permissions on the petition when passing the removeAll param", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds, removeAll: true) {
              id

              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.removePetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
          ],
        },
      ]);
    });

    it("sends error if neither userIds, userGroupIds or removeAll arguments are defined", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds, userIds: $userIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", otherPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id)],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error when passing empty arrays as arguments", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds, userIds: $userIds) {
              id
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [],
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("should not remove group permissions on the users when passing only userIds argument", async () => {
      await mocks.sharePetitions([userPetition.id], userGroupMembers[0].id, "READ");
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds, userIds: $userIds) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", userGroupMembers[0].id)],
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.removePetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "WRITE",
              group: { id: toGlobalId("UserGroup", userGroup.id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[1].id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[2].id) },
            },
          ],
        },
      ]);

      //also make sure that the group-assigned permission for user userGroupMembers[0] is still there
      const memberPermissions = await mocks.knex
        .from("petition_permission")
        .where({
          petition_id: userPetition.id,
          deleted_at: null,
          user_id: userGroupMembers[0].id,
          from_user_group_id: userGroup.id,
        })
        .select("*");

      expect(memberPermissions).toHaveLength(1);
    });

    it("should not remove directly-assigned user permissions when passing only groupIds argument", async () => {
      await mocks.sharePetitions([userPetition.id], userGroupMembers[0].id, "READ");
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionIds: [GID!]!, $userGroupIds: [GID!]!) {
            removePetitionPermission(petitionIds: $petitionIds, userGroupIds: $userGroupIds) {
              id
              permissions {
                permissionType
                ... on PetitionUserPermission {
                  user {
                    id
                  }
                }
                ... on PetitionUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userGroupIds: [toGlobalId("UserGroup", userGroup.id)],
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.removePetitionPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          permissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[1].id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[2].id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", userGroupMembers[0].id) },
            },
          ],
        },
      ]);
    });
  });
});
