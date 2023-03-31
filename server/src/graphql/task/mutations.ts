import { differenceInDays } from "date-fns";
import { booleanArg, idArg, mutationField, nonNull, nullable, objectType, stringArg } from "nexus";
import { isDefined } from "remeda";
import { Task } from "../../db/repositories/TaskRepository";
import { isValidTimezone } from "../../util/time";
import { authenticateAnd } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { datetimeArg } from "../helpers/scalars/DateTime";
import {
  petitionIsNotAnonymized,
  petitionsAreOfTypeTemplate,
  userHasAccessToPetitions,
  userHasEnabledIntegration,
  userHasFeatureFlag,
} from "../petition/authorizers";
import { contextUserHasRole } from "../users/authorizers";
import { tasksAreOfType, userHasAccessToTasks } from "./authorizers";

export const createPrintPdfTask = mutationField("createPrintPdfTask", {
  description: "Creates a task for printing a PDF of the petition and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId")
  ),
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
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId")
  ),
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

export const createTemplateRepliesReportTask = mutationField("createTemplateRepliesReportTask", {
  description:
    "Creates a task for exporting a report grouping the replies of every petition coming from the same template",
  type: "Task",
  authorize: authenticateAnd(
    contextUserHasRole("ADMIN"),
    userHasAccessToPetitions("petitionId"),
    petitionsAreOfTypeTemplate("petitionId")
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    timezone: nonNull(stringArg()),
    startDate: datetimeArg(),
    endDate: datetimeArg(),
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
          start_date: args.startDate,
          end_date: args.endDate,
        },
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const createTemplateStatsReportTask = mutationField("createTemplateStatsReportTask", {
  description: "Creates a task for generating a JSON report of the template usage",
  type: "Task",
  authorize: authenticateAnd(
    contextUserHasRole("ADMIN"),
    userHasAccessToPetitions("templateId"),
    petitionsAreOfTypeTemplate("templateId")
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    startDate: datetimeArg(),
    endDate: datetimeArg(),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.tasks.createTask(
      {
        name: "TEMPLATE_STATS_REPORT",
        user_id: ctx.user!.id,
        input: {
          template_id: args.templateId,
          start_date: args.startDate,
          end_date: args.endDate,
        },
      },
      `User:${ctx.user!.id}`
    );
  },
});

export const createDowJonesProfileDownloadTask = mutationField(
  "createDowJonesProfileDownloadTask",
  {
    description:
      "Creates a task for downloading a PDF file with the profile of an entity in DowJones",
    type: "Task",
    authorize: authenticateAnd(
      userHasFeatureFlag("DOW_JONES_KYC"),
      // avoid creating task if credentials are invalid, so TaskRunner doesn't throw error
      userHasEnabledIntegration("DOW_JONES_KYC", true)
    ),
    args: {
      profileId: nonNull(idArg()),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.tasks.createTask(
        {
          name: "DOW_JONES_PROFILE_DOWNLOAD",
          user_id: ctx.user!.id,
          input: {
            profile_id: args.profileId,
          },
        },
        `User:${ctx.user!.id}`
      );
    },
  }
);

export const createTemplatesOverviewReportTask = mutationField(
  "createTemplatesOverviewReportTask",
  {
    description: "Creates a task for generating an overview report of logged user's templates",
    type: "Task",
    authorize: authenticateAnd(contextUserHasRole("ADMIN")),
    args: {
      startDate: datetimeArg(),
      endDate: datetimeArg(),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.tasks.createTask(
        {
          name: "TEMPLATES_OVERVIEW_REPORT",
          user_id: ctx.user!.id,
          input: {
            start_date: args.startDate,
            end_date: args.endDate,
          },
        },
        `User:${ctx.user!.id}`
      );
    },
  }
);

export const getTaskResultFile = mutationField("getTaskResultFile", {
  description: "Returns an object with signed download url and filename for tasks with file output",
  type: objectType({
    name: "TaskResultFile",
    definition(t) {
      t.nonNull.string("filename");
      t.nonNull.string("url");
    },
  }),
  authorize: authenticateAnd(
    userHasAccessToTasks("taskId"),
    tasksAreOfType("taskId", [
      "EXPORT_REPLIES",
      "PRINT_PDF",
      "EXPORT_EXCEL",
      "TEMPLATE_REPLIES_REPORT",
      "DOW_JONES_PROFILE_DOWNLOAD",
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
      | Task<"TEMPLATE_REPLIES_REPORT">
      | Task<"DOW_JONES_PROFILE_DOWNLOAD">;

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

    return {
      url: await ctx.storage.temporaryFiles.getSignedDownloadEndpoint(
        file.path,
        file.filename,
        args.preview ? "inline" : "attachment"
      ),
      filename: file.filename,
    };
  },
});
