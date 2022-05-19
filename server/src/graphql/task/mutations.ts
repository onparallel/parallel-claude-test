import { ApolloError } from "apollo-server-core";
import { differenceInDays } from "date-fns";
import { booleanArg, mutationField, nonNull, nullable, stringArg } from "nexus";
import { isDefined } from "remeda";
import { Task } from "../../db/repositories/TaskRepository";
import { isValidTimezone } from "../../util/validators";
import { authenticateAnd } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { userHasAccessToPetitions } from "../petition/authorizers";
import { tasksAreOfType, userHasAccessToTasks } from "./authorizers";

export const createPrintPdfTask = mutationField("createPrintPdfTask", {
  description: "Creates a task for printing a PDF of the petition and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    skipAttachments: nullable(booleanArg()),
    includeNdLinks: nullable(booleanArg()),
  },
  resolve: async (_, args, ctx) =>
    await ctx.tasks.createTask(
      {
        name: "PRINT_PDF",
        user_id: ctx.user!.id,
        input: {
          petition_id: args.petitionId,
          skip_attachments: args.skipAttachments ?? false,
          include_netdocuments_links: args.includeNdLinks ?? false,
        },
      },
      `User:${ctx.user!.id}`
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
        user_id: ctx.user!.id,
        input: {
          petition_id: args.petitionId,
          pattern: args.pattern,
        },
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const createExportExcelTask = mutationField("createExportExcelTask", {
  description:
    "Creates a task for exporting an xlsx file with petition text replies and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.tasks.createTask(
      {
        name: "EXPORT_EXCEL",
        user_id: ctx.user!.id,
        input: {
          petition_id: args.petitionId,
        },
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const createExportReportTask = mutationField("createExportReportTask", {
  description:
    "Creates a task for exporting a report grouping the replies of every petition coming from the same template",
  type: "Task",
  authorize: authenticateAnd(userHasAccessToPetitions("petitionId")),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    timezone: nonNull(stringArg()),
  },
  validateArgs: (_, { timezone }, ctx, info) => {
    if (!isValidTimezone(timezone)) {
      throw new ArgValidationError(
        info,
        "timezone",
        `Invalid timezone ${timezone}`,
        "INVALID_TIMEZONE_ERROR"
      );
    }
  },
  resolve: async (_, args, ctx) => {
    return await ctx.tasks.createTask(
      {
        name: "TEMPLATE_REPLIES_REPORT",
        user_id: ctx.user!.id,
        input: {
          petition_id: args.petitionId,
          timezone: args.timezone,
        },
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const getTaskResultFileUrl = mutationField("getTaskResultFileUrl", {
  description: "Returns a signed download url for tasks with file output",
  type: "String",
  authorize: authenticateAnd(
    userHasAccessToTasks("taskId"),
    tasksAreOfType("taskId", [
      "EXPORT_REPLIES",
      "PRINT_PDF",
      "EXPORT_EXCEL",
      "TEMPLATE_REPLIES_REPORT",
    ])
  ),
  args: {
    taskId: nonNull(globalIdArg("Task")),
    preview: nullable(booleanArg()),
  },
  resolve: async (_, args, ctx) => {
    const task = (await ctx.tasks.loadTask(args.taskId)) as
      | Task<"EXPORT_REPLIES">
      | Task<"PRINT_PDF">
      | Task<"EXPORT_EXCEL">
      | Task<"TEMPLATE_REPLIES_REPORT">;

    const file = isDefined(task.output)
      ? await ctx.files.loadTemporaryFile(task.output.temporary_file_id)
      : null;

    if (
      !file ||
      // temporary files are deleted after 30 days on S3 bucket
      differenceInDays(new Date(), file.created_at) >= 30
    ) {
      throw new ApolloError(
        `Temporary file not found for Task:${task.id} output`,
        "FILE_NOT_FOUND_ERROR"
      );
    }
    return await ctx.aws.temporaryFiles.getSignedDownloadEndpoint(
      file.path,
      file.filename,
      args.preview ? "inline" : "attachment"
    );
  },
});
