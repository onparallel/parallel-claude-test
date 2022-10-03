import { gql } from "graphql-request";
import { Knex } from "knex";
import { KNEX } from "../../db/knex";
import { Mocks } from "../../db/repositories/__tests__/mocks";
import { Organization, Petition, Task, User } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { initServer, TestClient } from "./server";

describe("GraphQL/Tasks", () => {
  let mocks: Mocks;
  let testClient: TestClient;
  let user: User;
  let organization: Organization;

  let petition: Petition;

  let otherUser: User;
  let otherPetition: Petition;
  beforeAll(async () => {
    testClient = await initServer();
    const knex = testClient.container.get<Knex>(KNEX);
    mocks = new Mocks(knex);

    ({ user, organization } = await mocks.createSessionUserAndOrganization());

    [petition] = await mocks.createRandomPetitions(organization.id, user.id, 1);
    [otherUser] = await mocks.createRandomUsers(organization.id, 1);
    [otherPetition] = await mocks.createRandomPetitions(organization.id, otherUser.id, 1);
  });

  afterAll(async () => {
    await testClient.stop();
  });

  describe("task", () => {
    it("queries a task by id", async () => {
      const task = await mocks.createTask({
        name: "PRINT_PDF",
        input: { petition_id: petition.id },
        user_id: user.id,
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            task(id: $id) {
              id
              progress
              status
            }
          }
        `,
        { id: toGlobalId("Task", task.id) }
      );

      expect(errors).toBeUndefined();
      expect(data?.task).toEqual({
        id: toGlobalId("Task", task.id),
        progress: null,
        status: "ENQUEUED",
      });
    });

    it("sends error if trying to query a task of another user", async () => {
      const privateTask = await mocks.createTask({
        user_id: otherUser.id,
        name: "EXPORT_REPLIES",
        input: { petition_id: petition.id },
      });

      const { errors, data } = await testClient.execute(
        gql`
          query ($id: GID!) {
            task(id: $id) {
              id
            }
          }
        `,
        { id: toGlobalId("Task", privateTask.id) }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createPrintPdfTask", () => {
    it("creates a 'print pdf' task on a petition as a user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            createPrintPdfTask(petitionId: $petitionId) {
              status
            }
          }
        `,
        { petitionId: toGlobalId("Petition", petition.id) }
      );
      expect(errors).toBeUndefined();
      expect(data?.createPrintPdfTask).toEqual({ status: "ENQUEUED" });
    });

    it("sends error if trying to create a task on a private petition", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            createPrintPdfTask(petitionId: $petitionId) {
              status
            }
          }
        `,
        { petitionId: toGlobalId("Petition", otherPetition.id) }
      );
      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });
  });

  describe("createExportRepliesTask", () => {
    it("creates an 'export replies' task on a petition as a user", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($petitionId: GID!) {
            createExportRepliesTask(petitionId: $petitionId) {
              status
            }
          }
        `,
        { petitionId: toGlobalId("Petition", petition.id) }
      );
      expect(errors).toBeUndefined();
      expect(data?.createExportRepliesTask).toEqual({ status: "ENQUEUED" });
    });
  });

  describe("getTaskResultFile", () => {
    let completedTask: Task;
    let privateTask: Task;
    let incompleteTask: Task;

    beforeAll(async () => {
      const [file] = await mocks.createRandomTemporaryFile(1);
      completedTask = await mocks.createTask({
        user_id: user.id,
        name: "PRINT_PDF",
        progress: 100,
        status: "COMPLETED",
        input: { petition_id: petition.id },
        output: { temporary_file_id: file.id },
      });

      privateTask = await mocks.createTask({
        user_id: otherUser.id,
        name: "PRINT_PDF",
        progress: 100,
        status: "COMPLETED",
        input: { petition_id: otherPetition.id },
        output: { temporary_file_id: file.id },
      });

      incompleteTask = await mocks.createTask({
        user_id: user.id,
        name: "PRINT_PDF",
        input: { petition_id: petition.id },
      });
    });

    it("gets the result url of a print pdf task", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($taskId: GID!) {
            getTaskResultFile(taskId: $taskId) {
              url
              filename
            }
          }
        `,
        { taskId: toGlobalId("Task", completedTask.id) }
      );

      expect(errors).toBeUndefined();
      expect(data?.getTaskResultFile).toEqual({ url: "", filename: "file.pdf" });
    });

    it("sends error if trying to get the result of a private task", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($taskId: GID!) {
            getTaskResultFile(taskId: $taskId) {
              url
            }
          }
        `,
        { taskId: toGlobalId("Task", privateTask.id) }
      );

      expect(errors).toContainGraphQLError("FORBIDDEN");
      expect(data).toBeNull();
    });

    it("sends error if the task is not yet completed", async () => {
      const { errors, data } = await testClient.execute(
        gql`
          mutation ($taskId: GID!) {
            getTaskResultFile(taskId: $taskId) {
              url
            }
          }
        `,
        { taskId: toGlobalId("Task", incompleteTask.id) }
      );

      expect(errors).toContainGraphQLError("FILE_NOT_FOUND_ERROR");
      expect(data).toBeNull();
    });
  });
});
