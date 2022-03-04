import { gql } from "graphql-request";
import { Knex } from "knex";
import { USER_COGNITO_ID } from "../../../test/mocks";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import {
  Organization,
  Petition,
  TemplateDefaultPermission,
  User,
  UserGroup,
} from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/TemplateDefaultPermissions", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let knex: Knex;

  let users: User[];
  let organization: Organization;
  let templates: Petition[];
  let otherOrganization: Organization;
  let otherUsers: User[];
  let userGroup: UserGroup;

  beforeAll(async () => {
    testClient = await initServer();
    knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    [organization] = await mocks.createRandomOrganizations(1, () => ({ name: "Parallel" }));
    [otherOrganization] = await mocks.createRandomOrganizations(1);

    users = await mocks.createRandomUsers(organization.id, 3, (i) =>
      i === 0 ? { cognito_id: USER_COGNITO_ID } : {}
    );
    otherUsers = await mocks.createRandomUsers(otherOrganization.id, 2);

    templates = await mocks.createRandomPetitions(organization.id, users[0].id, 2, () => ({
      is_template: true,
      status: null,
    }));

    await mocks.createRandomPetitionFields(templates[0].id, 1, () => ({ type: "TEXT" }));
    await mocks.createRandomPetitionFields(templates[1].id, 1, () => ({ type: "TEXT" }));

    [userGroup] = await mocks.createUserGroups(1, organization.id);
    await mocks.insertUserGroupMembers(userGroup.id, [users[1].id, users[2].id]);
  });

  afterEach(async () => {
    await knex.from("template_default_permission").delete();
    await mocks.knex.from("public_petition_link").delete();
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("updateTemplateDefaultPermissions", () => {
    it("sends error if user does not have access to the template", async () => {
      const [privateTemplate] = await mocks.createRandomPetitions(
        organization.id,
        users[1].id,
        1,
        () => ({ is_template: true, status: null })
      );
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", privateTemplate.id),
          permissions: [
            {
              userId: toGlobalId("User", users[2].id),
              permissionType: "READ",
              isSubscribed: true,
            },
          ],
        },
      });

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if trying to pass a petition", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, users[0].id, 1);
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", petition.id),
          permissions: [
            {
              userId: toGlobalId("User", users[2].id),
              permissionType: "READ",
              isSubscribed: true,
            },
          ],
        },
      });
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if user does not have access to all the users in otherPermissions", async () => {
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userId: toGlobalId("User", otherUsers[0].id),
              permissionType: "READ",
              isSubscribed: true,
            },
          ],
        },
      });
    });

    it("deletes previous user permissions", async () => {
      const { errors: errors1, data: data1 } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
              defaultPermissions {
                permissionType
                isSubscribed
                ... on TemplateDefaultUserPermission {
                  user {
                    id
                  }
                }
                ... on TemplateDefaultUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userId: toGlobalId("User", users[1].id),
              permissionType: "READ",
              isSubscribed: true,
            },
          ],
        },
      });
      expect(errors1).toBeUndefined();
      expect(data1?.updateTemplateDefaultPermissions).toEqual({
        id: toGlobalId("Petition", templates[0].id),
        defaultPermissions: [
          {
            user: { id: toGlobalId("User", users[1].id) },
            permissionType: "READ",
            isSubscribed: true,
          },
        ],
      });

      const { errors: errors2, data: data2 } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
              defaultPermissions {
                permissionType
                isSubscribed
                ... on TemplateDefaultUserPermission {
                  user {
                    id
                  }
                }
                ... on TemplateDefaultUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userGroupId: toGlobalId("UserGroup", userGroup.id),
              permissionType: "READ",
              isSubscribed: true,
            },
            {
              userId: toGlobalId("User", users[2].id),
              permissionType: "READ",
              isSubscribed: true,
            },
          ],
        },
      });
      expect(errors2).toBeUndefined();
      expect(data2?.updateTemplateDefaultPermissions).toEqual({
        id: toGlobalId("Petition", templates[0].id),
        defaultPermissions: [
          {
            user: { id: toGlobalId("User", users[2].id) },
            permissionType: "READ",
            isSubscribed: true,
          },
          {
            group: { id: toGlobalId("UserGroup", userGroup.id) },
            permissionType: "READ",
            isSubscribed: true,
          },
        ],
      });
    });

    it("updates previous user permissions", async () => {
      const { errors: errors1, data: data1 } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
              defaultPermissions {
                permissionType
                isSubscribed
                ... on TemplateDefaultUserPermission {
                  user {
                    id
                  }
                }
                ... on TemplateDefaultUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userId: toGlobalId("User", users[0].id),
              permissionType: "READ",
              isSubscribed: true,
            },
          ],
        },
      });
      expect(errors1).toBeUndefined();
      expect(data1?.updateTemplateDefaultPermissions).toEqual({
        id: toGlobalId("Petition", templates[0].id),
        defaultPermissions: [
          {
            user: { id: toGlobalId("User", users[0].id) },
            permissionType: "READ",
            isSubscribed: true,
          },
        ],
      });

      const { errors: errors2, data: data2 } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
              defaultPermissions {
                permissionType
                isSubscribed
                ... on TemplateDefaultUserPermission {
                  user {
                    id
                  }
                }
                ... on TemplateDefaultUserGroupPermission {
                  group {
                    id
                  }
                }
              }
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userId: toGlobalId("User", users[1].id),
              permissionType: "WRITE",
              isSubscribed: true,
            },
            {
              userGroupId: toGlobalId("UserGroup", userGroup.id),
              permissionType: "READ",
              isSubscribed: true,
            },
          ],
        },
      });
      expect(errors2).toBeUndefined();
      expect(data2?.updateTemplateDefaultPermissions).toEqual({
        id: toGlobalId("Petition", templates[0].id),
        defaultPermissions: [
          {
            user: { id: toGlobalId("User", users[1].id) },
            permissionType: "WRITE",
            isSubscribed: true,
          },
          {
            group: { id: toGlobalId("UserGroup", userGroup.id) },
            permissionType: "READ",
            isSubscribed: true,
          },
        ],
      });
    });

    it("transfers the ownership if passing a different owner when updating", async () => {
      await mocks.knex<TemplateDefaultPermission>("template_default_permission").insert([
        {
          template_id: templates[0].id,
          type: "OWNER",
          user_id: users[0].id,
        },
        {
          template_id: templates[0].id,
          type: "WRITE",
          user_id: users[1].id,
        },
      ]);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              ... on PetitionTemplate {
                defaultPermissions {
                  permissionType
                  isSubscribed
                  ... on TemplateDefaultUserPermission {
                    user {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userId: toGlobalId("User", users[1].id),
              permissionType: "OWNER",
              isSubscribed: true,
            },
            {
              userId: toGlobalId("User", users[0].id),
              permissionType: "WRITE",
              isSubscribed: false,
            },
          ],
        }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateTemplateDefaultPermissions).toEqual({
        defaultPermissions: [
          {
            permissionType: "OWNER",
            user: { id: toGlobalId("User", users[1].id) },
            isSubscribed: true,
          },
          {
            permissionType: "WRITE",
            user: { id: toGlobalId("User", users[0].id) },
            isSubscribed: false,
          },
        ],
      });
    });

    it("adds default permissions so petitions created from the template inherit them", async () => {
      const res = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              userId: toGlobalId("User", users[1].id),
              permissionType: "WRITE",
              isSubscribed: true,
            },
            {
              userGroupId: toGlobalId("UserGroup", userGroup.id),
              permissionType: "READ",
              isSubscribed: false,
            },
          ],
        },
      });
      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($petitionId: GID) {
            createPetition(type: PETITION, petitionId: $petitionId, locale: en) {
              id
              permissions {
                permissionType
                isSubscribed
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
          petitionId: toGlobalId("Petition", templates[0].id),
        },
      });
      expect(errors).toBeUndefined();
      expect(data?.createPetition).toEqual({
        id: expect.any(String),
        permissions: [
          {
            isSubscribed: true,
            permissionType: "OWNER",
            user: { id: toGlobalId("User", users[0].id) },
          },
          {
            isSubscribed: true,
            permissionType: "WRITE",
            user: {
              id: toGlobalId("User", users[1].id),
            },
          },
          {
            group: {
              id: toGlobalId("UserGroup", userGroup.id),
            },
            isSubscribed: false,
            permissionType: "READ",
          },
        ],
      });
    });

    it("sends error if trying to give read/write permissions to a user that is the owner of an active public link without passing a new owner", async () => {
      await mocks.createRandomPublicPetitionLink(templates[0].id, users[0].id);

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              isSubscribed: true,
              permissionType: "WRITE",
              userId: toGlobalId("User", users[0].id),
            },
          ],
        },
      });

      expect(errors).toContainGraphQLError("UPDATE_TEMPLATE_DEFAULT_PERMISSIONS_ERROR");
      expect(data).toBeNull();
    });

    it("overwrites the permission if giving read/write access to a user that is the owner of an inactive public link, and nulls the link owner", async () => {
      await mocks.createRandomPublicPetitionLink(templates[0].id, users[0].id, () => ({
        is_active: false,
      }));

      const { errors, data } = await testClient.mutate({
        mutation: gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              id
              publicLink {
                isActive
                owner {
                  id
                }
              }
              defaultPermissions {
                ... on TemplateDefaultUserPermission {
                  user {
                    id
                  }
                }
                permissionType
              }
            }
          }
        `,
        variables: {
          templateId: toGlobalId("Petition", templates[0].id),
          permissions: [
            {
              isSubscribed: true,
              permissionType: "WRITE",
              userId: toGlobalId("User", users[0].id),
            },
          ],
        },
      });

      expect(errors).toBeUndefined();
      expect(data?.updateTemplateDefaultPermissions).toEqual({
        id: toGlobalId("Petition", templates[0].id),
        publicLink: {
          isActive: false,
          owner: null,
        },
        defaultPermissions: [
          {
            permissionType: "WRITE",
            user: {
              id: toGlobalId("User", users[0].id),
            },
          },
        ],
      });
    });

    it("should disable public link if removing owner from default permissions", async () => {
      const publicLink = await mocks.createRandomPublicPetitionLink(templates[0].id, users[0].id);

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($templateId: GID!, $permissions: [UserOrUserGroupPermissionInput!]!) {
            updateTemplateDefaultPermissions(templateId: $templateId, permissions: $permissions) {
              defaultPermissions {
                __typename
              }
              publicLink {
                id
                isActive
                owner {
                  id
                }
              }
            }
          }
        `,
        { templateId: toGlobalId("Petition", templates[0].id), permissions: [] }
      );

      expect(errors).toBeUndefined();
      expect(data?.updateTemplateDefaultPermissions).toEqual({
        defaultPermissions: [],
        publicLink: {
          id: toGlobalId("PublicPetitionLink", publicLink.id),
          isActive: false,
          owner: null,
        },
      });
    });
  });
});
