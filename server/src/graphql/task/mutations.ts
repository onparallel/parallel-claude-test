import { booleanArg, mutationField, nonNull, nullable } from "nexus";
import { Task } from "../../db/repositories/TaskRepository";
import { authenticateAnd } from "../helpers/authorize";
import { WhitelistedError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { RESULT } from "../helpers/result";
import { userHasAccessToPetitions } from "../petition/authorizers";
import { tasksAreOfType, userHasAccessToTasks } from "./authorizers";

export const createPrintPdfTask = mutationField("createPrintPdfTask", {
  description: "Creates a task for printing a PDF of the petition and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) =>
    await ctx.tasks.createTask(
      {
        name: "PRINT_PDF",
        input: {
          petition_id: args.petitionId,
        },
      },
      ctx.user!.id
    ),
});

export const createExportRepliesTask = mutationField("createExportRepliesTask", {
  description:
    "Creates a task for exporting a ZIP file with petition replies and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    pattern: nullable("String"),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.tasks.createTask(
      {
        name: "EXPORT_REPLIES",
        input: {
          petition_id: args.petitionId,
          pattern: args.pattern,
        },
      },
      ctx.user!.id
    );
  },
});

export const getTaskResultFileUrl = mutationField("getTaskResultFileUrl", {
  description: "Returns a signed download url for tasks with file output",
  type: "FileUploadDownloadLinkResult",
  authorize: authenticateAnd(
    userHasAccessToTasks("taskId"),
    tasksAreOfType("taskId", ["EXPORT_REPLIES", "PRINT_PDF"])
  ),
  args: {
    taskId: nonNull(globalIdArg("Task")),
    preview: nullable(booleanArg()),
  },
  resolve: async (_, args, ctx) => {
    try {
      const task = (await ctx.tasks.loadTask(args.taskId)) as
        | Task<"EXPORT_REPLIES">
        | Task<"PRINT_PDF">;

      const file = await ctx.files.loadTemporaryFile(task.output.temporary_file_id);
      if (!file) {
        // TODO: no tiene mucho sentido tirar un WhitelistedError aqui
        throw new WhitelistedError(
          `Temporary file not found for Task:${task.id} output`,
          "FILE_NOT_FOUND_ERROR"
        );
      }
      const url = await ctx.aws.temporaryFiles.getSignedDownloadEndpoint(
        file?.path,
        file?.filename,
        args.preview ? "inline" : "attachment"
      );

      return {
        result: RESULT.SUCCESS,
        url,
      };
    } catch {}
    return { result: RESULT.FAILURE };
  },
});
