import gql from "graphql-tag";
import { Knex } from "knex";
import { Organization, Petition, ProfileType, ProfileTypeProcess, User } from "../../db/__types";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Profile Type Processes", () => {
  let testClient: TestClient;
  let mocks: Mocks;
  let organization: Organization;
  let user: User;
  let normalUserApiKey: string;

  let templates: Petition[];
  let profileType: ProfileType;

  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ organization, user } = await mocks.createSessionUserAndOrganization());

    await mocks.createFeatureFlags([{ name: "PROFILES", default_value: true }]);

    const [userGroup] = await mocks.knex
      .from("user_group")
      .where({ type: "ALL_USERS", org_id: organization.id })
      .select("*");

    await mocks.knex.from("user_group_permission").insert({
      user_group_id: userGroup.id,
      name: "PROFILE_TYPES:CRUD_PROFILE_TYPES",
      effect: "GRANT",
    });

    // create another user in org without the required permission
    const [normalUser] = await mocks.createRandomUsers(organization.id, 1);
    const [normalGroup] = await mocks.createUserGroups(1, organization.id, [
      { name: "PROFILE_TYPES:CRUD_PROFILE_TYPES", effect: "DENY" },
    ]);
    await mocks.insertUserGroupMembers(normalGroup.id, [normalUser.id]);
    ({ apiKey: normalUserApiKey } = await mocks.createUserAuthToken(
      "normal-user-apikey",
      normalUser.id,
    ));

    templates = await mocks.createRandomTemplates(organization.id, user.id, 3);
    [profileType] = await mocks.createRandomProfileTypes(organization.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("createProfileTypeProcess", () => {
    beforeEach(async () => {
      await mocks.knex.from("profile_type_process_template").delete();
      await mocks.knex.from("profile_type_process").delete();
    });

    it("creates a process on a profile type", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $processName: LocalizableUserText!
            $templateIds: [GID!]!
          ) {
            createProfileTypeProcess(
              profileTypeId: $profileTypeId
              processName: $processName
              templateIds: $templateIds
            ) {
              id
              name
              position
              templates {
                id
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          processName: { en: "Process 1" },
          templateIds: templates.map((t) => toGlobalId("Petition", t.id)),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.createProfileTypeProcess).toEqual({
        id: expect.any(String),
        name: { en: "Process 1" },
        position: 0,
        templates: templates.map((t) => ({ id: toGlobalId("Petition", t.id) })),
      });
    });

    it("fails if trying to create more than 3 processes on the same profile type", async () => {
      for (let i = 0; i < 3; i++) {
        const { errors, data } = await testClient.execute(
          gql`
            mutation (
              $profileTypeId: GID!
              $processName: LocalizableUserText!
              $templateIds: [GID!]!
            ) {
              createProfileTypeProcess(
                profileTypeId: $profileTypeId
                processName: $processName
                templateIds: $templateIds
              ) {
                id
                name
                position
                templates {
                  id
                }
              }
            }
          `,
          {
            profileTypeId: toGlobalId("ProfileType", profileType.id),
            processName: { en: `Process ${i}` },
            templateIds: [toGlobalId("Petition", templates[0].id)],
          },
        );

        expect(errors).toBeUndefined();
        expect(data?.createProfileTypeProcess).toEqual({
          id: expect.any(String),
          name: { en: `Process ${i}` },
          position: i,
          templates: [{ id: toGlobalId("Petition", templates[0].id) }],
        });
      }

      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $processName: LocalizableUserText!
            $templateIds: [GID!]!
          ) {
            createProfileTypeProcess(
              profileTypeId: $profileTypeId
              processName: $processName
              templateIds: $templateIds
            ) {
              id
              name
              position
              templates {
                id
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          processName: { en: `Process 3` },
          templateIds: [toGlobalId("Petition", templates[0].id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if passing repeated template ids", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $processName: LocalizableUserText!
            $templateIds: [GID!]!
          ) {
            createProfileTypeProcess(
              profileTypeId: $profileTypeId
              processName: $processName
              templateIds: $templateIds
            ) {
              id
              name
              position
              templates {
                id
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          processName: { en: "My Process" },
          templateIds: [
            toGlobalId("Petition", templates[0].id),
            toGlobalId("Petition", templates[0].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if passing empty template ids array", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $processName: LocalizableUserText!
            $templateIds: [GID!]!
          ) {
            createProfileTypeProcess(
              profileTypeId: $profileTypeId
              processName: $processName
              templateIds: $templateIds
            ) {
              id
              name
              position
              templates {
                id
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          processName: { en: "My Process" },
          templateIds: [],
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if passing a petition as template id", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $processName: LocalizableUserText!
            $templateIds: [GID!]!
          ) {
            createProfileTypeProcess(
              profileTypeId: $profileTypeId
              processName: $processName
              templateIds: $templateIds
            ) {
              id
              name
              position
              templates {
                id
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          processName: { en: "My Process" },
          templateIds: [toGlobalId("Petition", petition.id)],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if user does not have PROFILE_TYPES:CRUD_PROFILE_TYPES permission", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation (
            $profileTypeId: GID!
            $processName: LocalizableUserText!
            $templateIds: [GID!]!
          ) {
            createProfileTypeProcess(
              profileTypeId: $profileTypeId
              processName: $processName
              templateIds: $templateIds
            ) {
              id
              name
              position
              templates {
                id
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          processName: { en: "My Process" },
          templateIds: templates.map((t) => toGlobalId("Petition", t.id)),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("editProfileTypeProcess", () => {
    let profileTypeProcess: ProfileTypeProcess;

    beforeEach(async () => {
      await mocks.knex.from("profile_type_process_template").delete();
      await mocks.knex.from("profile_type_process").delete();

      [profileTypeProcess] = await mocks.knex
        .from("profile_type_process")
        .insert(
          { profile_type_id: profileType.id, process_name: { en: "My Process" }, position: 0 },
          "*",
        );

      await mocks.knex.from("profile_type_process_template").insert(
        templates.map((t) => ({
          template_id: t.id,
          profile_type_process_id: profileTypeProcess.id,
        })),
      );
    });

    it("edits the name and templates of a process on a profile type", async () => {
      const newTemplates = await mocks.createRandomTemplates(organization.id, user.id, 2);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeProcessId: GID!, $data: EditProfileTypeProcessInput!) {
            editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
              id
              name
              position
              templates {
                id
              }
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
          data: {
            processName: { en: "New Process Name", es: "Nuevo Nombre de Proceso" },
            templateIds: newTemplates.map((t) => toGlobalId("Petition", t.id)),
          },
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.editProfileTypeProcess).toEqual({
        id: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
        name: { en: "New Process Name", es: "Nuevo Nombre de Proceso" },
        position: 0,
        templates: newTemplates.map((t) => ({ id: toGlobalId("Petition", t.id) })),
      });
    });

    it("fails if passing repeated template ids", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeProcessId: GID!, $data: EditProfileTypeProcessInput!) {
            editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
          data: {
            processName: { en: "New Process Name" },
            templateIds: [
              toGlobalId("Petition", templates[0].id),
              toGlobalId("Petition", templates[0].id),
            ],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if passing empty template ids array", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeProcessId: GID!, $data: EditProfileTypeProcessInput!) {
            editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
          data: {
            processName: { en: "New Process Name" },
            templateIds: [],
          },
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });

    it("fails if user does not have access to the process", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);
      const { apiKey } = await mocks.createUserAuthToken("other-user-apikey", otherUser.id);

      const { errors, data } = await testClient.withApiKey(apiKey).execute(
        gql`
          mutation ($profileTypeProcessId: GID!, $data: EditProfileTypeProcessInput!) {
            editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
          data: {
            processName: { en: "New Process Name" },
            templateIds: templates.map((t) => toGlobalId("Petition", t.id)),
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if user does not have PROFILE_TYPES:CRUD_PROFILE_TYPES permission", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeProcessId: GID!, $data: EditProfileTypeProcessInput!) {
            editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
          data: {
            processName: { en: "New Process Name" },
            templateIds: templates.map((t) => toGlobalId("Petition", t.id)),
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if passing petitions as new template ids", async () => {
      const [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeProcessId: GID!, $data: EditProfileTypeProcessInput!) {
            editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
          data: {
            processName: { en: "New Process Name" },
            templateIds: [toGlobalId("Petition", petition.id)],
          },
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if passing empty data", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeProcessId: GID!, $data: EditProfileTypeProcessInput!) {
            editProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId, data: $data) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", profileTypeProcess.id),
          data: {},
        },
      );

      expect(errors).toContainGraphQLError("ARG_VALIDATION_ERROR");
      expect(data).toBeNull();
    });
  });

  describe("removeProfileTypeProcess", () => {
    let processes: ProfileTypeProcess[];

    beforeEach(async () => {
      await mocks.knex.from("profile_type_process_template").delete();
      await mocks.knex.from("profile_type_process").delete();

      processes = await mocks.knex.from("profile_type_process").insert(
        [
          {
            profile_type_id: profileType.id,
            process_name: { en: "My First Process" },
            position: 0,
          },
          {
            profile_type_id: profileType.id,
            process_name: { en: "My Second Process" },
            position: 1,
          },
          {
            profile_type_id: profileType.id,
            process_name: { en: "My Third Process" },
            position: 2,
          },
        ],
        "*",
      );

      await mocks.knex.from("profile_type_process_template").insert(
        processes.flatMap((p) =>
          templates.map((t) => ({
            template_id: t.id,
            profile_type_process_id: p.id,
          })),
        ),
      );
    });

    it("removes a process from a profile type and its templates", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeProcessId: GID!) {
            removeProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId) {
              id
              keyProcesses {
                id
                name
                position
              }
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", processes[2].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.removeProfileTypeProcess).toEqual({
        id: toGlobalId("ProfileType", profileType.id),
        keyProcesses: [
          {
            id: toGlobalId("ProfileTypeProcess", processes[0].id),
            name: { en: "My First Process" },
            position: 0,
          },
          {
            id: toGlobalId("ProfileTypeProcess", processes[1].id),
            name: { en: "My Second Process" },
            position: 1,
          },
        ],
      });

      const dbProfileTypeProcessTemplates = await mocks.knex
        .from("profile_type_process_template")
        .where("profile_type_process_id", processes[2].id);

      expect(dbProfileTypeProcessTemplates).toHaveLength(0);
    });

    it("correctly reorders the remaining processes", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeProcessId: GID!) {
            removeProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId) {
              id
              keyProcesses {
                id
                name
                position
              }
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", processes[0].id),
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.removeProfileTypeProcess).toEqual({
        id: toGlobalId("ProfileType", profileType.id),
        keyProcesses: [
          {
            id: toGlobalId("ProfileTypeProcess", processes[1].id),
            name: { en: "My Second Process" },
            position: 0,
          },
          {
            id: toGlobalId("ProfileTypeProcess", processes[2].id),
            name: { en: "My Third Process" },
            position: 1,
          },
        ],
      });
    });

    it("fails if user does not have access to the process", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);
      const { apiKey } = await mocks.createUserAuthToken("other-user-apikey", otherUser.id);

      const { errors, data } = await testClient.withApiKey(apiKey).execute(
        gql`
          mutation ($profileTypeProcessId: GID!) {
            removeProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", processes[0].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if user does not have PROFILE_TYPES:CRUD_PROFILE_TYPES permission", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeProcessId: GID!) {
            removeProfileTypeProcess(profileTypeProcessId: $profileTypeProcessId) {
              id
            }
          }
        `,
        {
          profileTypeProcessId: toGlobalId("ProfileTypeProcess", processes[0].id),
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("updateProfileTypeProcessPositions", () => {
    let processes: ProfileTypeProcess[];

    beforeEach(async () => {
      await mocks.knex.from("profile_type_process_template").delete();
      await mocks.knex.from("profile_type_process").delete();

      processes = await mocks.knex.from("profile_type_process").insert(
        [
          {
            profile_type_id: profileType.id,
            process_name: { en: "My First Process" },
            position: 0,
          },
          {
            profile_type_id: profileType.id,
            process_name: { en: "My Second Process" },
            position: 1,
          },
          {
            profile_type_id: profileType.id,
            process_name: { en: "My Third Process" },
            position: 2,
          },
        ],
        "*",
      );
    });

    it("updates the positions of the processes in a profile type based on the passed order", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeProcessIds: [GID!]!) {
            updateProfileTypeProcessPositions(
              profileTypeId: $profileTypeId
              profileTypeProcessIds: $profileTypeProcessIds
            ) {
              id
              keyProcesses {
                id
                name
                position
              }
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          profileTypeProcessIds: [
            toGlobalId("ProfileTypeProcess", processes[2].id),
            toGlobalId("ProfileTypeProcess", processes[0].id),
            toGlobalId("ProfileTypeProcess", processes[1].id),
          ],
        },
      );

      expect(errors).toBeUndefined();
      expect(data?.updateProfileTypeProcessPositions).toEqual({
        id: toGlobalId("ProfileType", profileType.id),
        keyProcesses: [
          {
            id: toGlobalId("ProfileTypeProcess", processes[2].id),
            name: { en: "My Third Process" },
            position: 0,
          },
          {
            id: toGlobalId("ProfileTypeProcess", processes[0].id),
            name: { en: "My First Process" },
            position: 1,
          },
          {
            id: toGlobalId("ProfileTypeProcess", processes[1].id),
            name: { en: "My Second Process" },
            position: 2,
          },
        ],
      });
    });

    it("fails if the passed profile type does not have the same amount of processes as the passed order", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeProcessIds: [GID!]!) {
            updateProfileTypeProcessPositions(
              profileTypeId: $profileTypeId
              profileTypeProcessIds: $profileTypeProcessIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          profileTypeProcessIds: [
            toGlobalId("ProfileTypeProcess", processes[2].id),
            toGlobalId("ProfileTypeProcess", processes[0].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if user does not have access to the profile type", async () => {
      const [otherOrg] = await mocks.createRandomOrganizations(1);
      const [otherUser] = await mocks.createRandomUsers(otherOrg.id, 1);
      const { apiKey } = await mocks.createUserAuthToken("other-user-apikey", otherUser.id);

      const { errors, data } = await testClient.withApiKey(apiKey).execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeProcessIds: [GID!]!) {
            updateProfileTypeProcessPositions(
              profileTypeId: $profileTypeId
              profileTypeProcessIds: $profileTypeProcessIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          profileTypeProcessIds: [
            toGlobalId("ProfileTypeProcess", processes[2].id),
            toGlobalId("ProfileTypeProcess", processes[0].id),
            toGlobalId("ProfileTypeProcess", processes[1].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if the passed processes do not belong to the profile type", async () => {
      const [otherProfileType] = await mocks.createRandomProfileTypes(organization.id, 1);
      const [otherProcess] = await mocks.knex.from("profile_type_process").insert(
        {
          profile_type_id: otherProfileType.id,
          process_name: { en: "Other Process" },
          position: 0,
        },
        "*",
      );

      const { errors, data } = await testClient.execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeProcessIds: [GID!]!) {
            updateProfileTypeProcessPositions(
              profileTypeId: $profileTypeId
              profileTypeProcessIds: $profileTypeProcessIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          profileTypeProcessIds: [
            toGlobalId("ProfileTypeProcess", processes[2].id),
            toGlobalId("ProfileTypeProcess", otherProcess.id),
            toGlobalId("ProfileTypeProcess", processes[1].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("fails if user does not have PROFILE_TYPES:CRUD_PROFILE_TYPES permission", async () => {
      const { errors, data } = await testClient.withApiKey(normalUserApiKey).execute(
        gql`
          mutation ($profileTypeId: GID!, $profileTypeProcessIds: [GID!]!) {
            updateProfileTypeProcessPositions(
              profileTypeId: $profileTypeId
              profileTypeProcessIds: $profileTypeProcessIds
            ) {
              id
            }
          }
        `,
        {
          profileTypeId: toGlobalId("ProfileType", profileType.id),
          profileTypeProcessIds: [
            toGlobalId("ProfileTypeProcess", processes[2].id),
            toGlobalId("ProfileTypeProcess", processes[0].id),
            toGlobalId("ProfileTypeProcess", processes[1].id),
          ],
        },
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull;
    });
  });
});
