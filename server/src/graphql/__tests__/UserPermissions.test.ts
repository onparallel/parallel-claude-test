import gql from "graphql-tag";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, User } from "../../db/__types";
import { EMAILS, IEmailsService } from "../../services/emails";
import { toGlobalId } from "../../util/globalId";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { initServer, TestClient } from "./server";

describe("GraphQL/User Permissions", () => {
  let testClient: TestClient;
  let organization: Organization;
  let loggedUser: User;
  let orgUsers: User[];
  let otherOrgUser: User;
  let mocks: Mocks;

  let userPetition: Petition;
  let otherPetition: Petition;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({
      identifier: "parallel",
      status: "DEV",
    }));

    const [otherOrg] = await mocks.createRandomOrganizations(1);

    [loggedUser] = await mocks.createRandomUsers(organization.id, 1, () => ({
      cognito_id: USER_COGNITO_ID,
      first_name: "Harvey",
      last_name: "Specter",
      org_id: organization.id,
    }));

    orgUsers = await mocks.createRandomUsers(organization.id, 3);
    [otherOrgUser] = await mocks.createRandomUsers(otherOrg.id, 1);
  });

  beforeEach(async () => {
    [userPetition] = await mocks.createRandomPetitions(
      organization.id,
      loggedUser.id,
      1
    );
    [otherPetition] = await mocks.createRandomPetitions(
      organization.id,
      orgUsers[1].id,
      1
    );
  });

  afterEach(async () => {
    await mocks.clearSharedPetitions();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("transferPetitionOwnership", () => {
    it("transfers ownership of a petition to given user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
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
          ids: [toGlobalId("Petition", userPetition.id)],
          userId: toGlobalId("User", orgUsers[0].id),
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.transferPetitionOwnership).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          userPermissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", orgUsers[0].id) },
            },
            {
              permissionType: "WRITE",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
          ],
        },
      ]);
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
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
          mutation($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
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
          mutation($ids: [GID!]!, $userId: GID!) {
            transferPetitionOwnership(petitionIds: $ids, userId: $userId) {
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
          ids: [],
          userId: toGlobalId("User", loggedUser.id),
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("addPetitionUserPermission", () => {
    it("adds new permissions on a given petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionTypeRW!
          ) {
            addPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
              message: "hello!"
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.addPetitionUserPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          userPermissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
            {
              permissionType: "READ",
              user: { id: toGlobalId("User", orgUsers[0].id) },
            },
          ],
        },
      ]);
    });

    it("sends notification email to users after adding permissions", async () => {
      const sendPetitionSharingNotificationEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharingNotificationEmail"
      );

      await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionTypeRW!
          ) {
            addPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
              notify: true
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      expect(sendPetitionSharingNotificationEmailSpy).toHaveBeenCalledTimes(1);
    });

    it("doesn't send notification email to users if notify arg is false or undefined", async () => {
      const sendPetitionSharingNotificationEmailSpy = jest.spyOn(
        testClient.container.get<IEmailsService>(EMAILS),
        "sendPetitionSharingNotificationEmail"
      );

      await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionTypeRW!
          ) {
            addPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[0].id)],
          type: "READ",
        },
      });

      expect(sendPetitionSharingNotificationEmailSpy).toHaveBeenCalledTimes(0);
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionTypeRW!
          ) {
            addPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionTypeRW!
          ) {
            addPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionTypeRW!
          ) {
            addPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [],
          userIds: [],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to add permissions for logged user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionTypeRW!
          ) {
            addPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", loggedUser.id)],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("editPetitionUserPermission", () => {
    beforeEach(async () => {
      await mocks.sharePetitions([userPetition.id], orgUsers[1].id, "READ");
      await mocks.sharePetitions([userPetition.id], orgUsers[2].id, "READ");
    });

    afterEach(async () => {
      await mocks.clearSharedPetitions();
    });

    it("changes permission type for given set of petitions and users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionType!
          ) {
            editPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [
            toGlobalId("User", orgUsers[1].id),
            toGlobalId("User", orgUsers[2].id),
          ],
          type: "WRITE",
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.editPetitionUserPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          userPermissions: [
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
          ],
        },
      ]);
    });

    it("sends error if user sets more than one owner", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionType!
          ) {
            editPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [
            toGlobalId("User", orgUsers[1].id),
            toGlobalId("User", orgUsers[2].id),
          ],
          type: "OWNER",
        },
      });

      expect(errors).toContainGraphQLError("PETITION_OWNER_CONSTRAINT_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionType!
          ) {
            editPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionType!
          ) {
            editPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionType!
          ) {
            editPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [],
          userIds: [],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error when trying to edit permissions for logged user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation(
            $petitionIds: [GID!]!
            $userIds: [GID!]!
            $type: PetitionUserPermissionType!
          ) {
            editPetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
              permissionType: $type
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", loggedUser.id)],
          type: "READ",
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("removePetitionUserPermission", () => {
    beforeEach(async () => {
      await mocks.sharePetitions([userPetition.id], orgUsers[1].id, "READ");
      await mocks.sharePetitions([userPetition.id], orgUsers[2].id, "READ");
    });

    afterEach(async () => {
      await mocks.clearSharedPetitions();
    });

    it("removes permissions for given set of petitions and users", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", orgUsers[1].id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.removePetitionUserPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          userPermissions: [
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

    it("removes all permissions on the petition when passing the removeAll param", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            removePetitionUserPermission(
              petitionIds: $petitionIds
              removeAll: true
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
        },
      });

      expect(errors).toBeUndefined();
      expect(data!.removePetitionUserPermission).toEqual([
        {
          id: toGlobalId("Petition", userPetition.id),
          userPermissions: [
            {
              permissionType: "OWNER",
              user: { id: toGlobalId("User", loggedUser.id) },
            },
          ],
        },
      ]);
    });

    it("sends error if neither userIds nor removeAll arguments are defined", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!) {
            removePetitionUserPermission(petitionIds: $petitionIds) {
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

    it("sends error when trying to remove permissions for logged user", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [toGlobalId("User", loggedUser.id)],
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("sends error if user is not owner of the petition", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
            ) {
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
          mutation($petitionIds: [GID!]!, $userIds: [GID!]!) {
            removePetitionUserPermission(
              petitionIds: $petitionIds
              userIds: $userIds
            ) {
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
          petitionIds: [toGlobalId("Petition", userPetition.id)],
          userIds: [],
        },
      });

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });
});
