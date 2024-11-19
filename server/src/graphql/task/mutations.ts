import { differenceInDays } from "date-fns";
import {
  arg,
  booleanArg,
  idArg,
  list,
  mutationField,
  nonNull,
  nullable,
  objectType,
  stringArg,
} from "nexus";
import { outdent } from "outdent";
import pMap from "p-map";
import {
  differenceWith,
  filter,
  groupBy,
  isNonNullish,
  isNullish,
  pipe,
  sumBy,
  unique,
  uniqueBy,
  zip,
} from "remeda";
import { Task } from "../../db/repositories/TaskRepository";
import { CellError, InvalidDataError, UnknownIdError } from "../../services/ProfileImportService";
import { toBytes } from "../../util/fileSize";
import { toGlobalId } from "../../util/globalId";
import { withError } from "../../util/promises/withError";
import { isValidTimezone } from "../../util/time";
import { random } from "../../util/token";
import { authenticateAnd, ifArgDefined } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { importFromExcel } from "../helpers/importDataFromExcel";
import { datetimeArg } from "../helpers/scalars/DateTime";
import { uploadArg } from "../helpers/scalars/Upload";
import { validateAnd, validateIf } from "../helpers/validateArgs";
import { maxLength } from "../helpers/validators/maxLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";
import { validateFile } from "../helpers/validators/validateFile";
import { validBooleanValue } from "../helpers/validators/validBooleanValue";
import { validFileUploadInput } from "../helpers/validators/validFileUploadInput";
import { validExportFileRenamePattern } from "../helpers/validators/validTextWithPlaceholders";
import {
  authenticateBackgroundCheckToken,
  userHasAccessToIntegrations,
} from "../integrations/authorizers";
import {
  petitionHasRepliableFields,
  petitionIsNotAnonymized,
  petitionsAreOfTypePetition,
  petitionsAreOfTypeTemplate,
  petitionsHaveEnabledInteractionWithRecipients,
  userHasAccessToPetitions,
  userHasEnabledIntegration,
  userHasFeatureFlag,
} from "../petition/authorizers";
import { userHasAccessToUsers } from "../petition/mutations/authorizers";
import { userHasAccessToProfileType } from "../profile/authorizers";
import { userHasAccessToUserGroups } from "../user-group/authorizers";
import { contextUserHasPermission } from "../users/authorizers";
import { tasksAreOfType, userHasAccessToTasks } from "./authorizers";

export const createPrintPdfTask = mutationField("createPrintPdfTask", {
  description: "Creates a task for printing a PDF of the petition and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId"),
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
      `User:${ctx.user!.id}`,
    ),
});

export const createExportRepliesTask = mutationField("createExportRepliesTask", {
  description:
    "Creates a task for exporting a ZIP file with petition replies and sends it to the queue",
  type: "Task",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    pattern: nullable("String"),
  },
  validateArgs: validExportFileRenamePattern("pattern"),
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
      `User:${ctx.user!.id}`,
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
      `User:${ctx.user!.id}`,
    );
  },
});

export const createTemplateRepliesReportTask = mutationField("createTemplateRepliesReportTask", {
  description:
    "Creates a task for exporting a report grouping the replies of every petition coming from the same template",
  type: "Task",
  authorize: authenticateAnd(
    contextUserHasPermission("REPORTS:TEMPLATE_REPLIES"),
    userHasAccessToPetitions("petitionId"),
    petitionsAreOfTypeTemplate("petitionId"),
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
        "INVALID_TIMEZONE_ERROR",
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
      `User:${ctx.user!.id}`,
    );
  },
});

export const createTemplateStatsReportTask = mutationField("createTemplateStatsReportTask", {
  description: "Creates a task for generating a JSON report of the template usage",
  type: "Task",
  authorize: authenticateAnd(
    contextUserHasPermission("REPORTS:TEMPLATE_STATISTICS"),
    userHasAccessToPetitions("templateId"),
    petitionsAreOfTypeTemplate("templateId"),
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
      `User:${ctx.user!.id}`,
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
      userHasEnabledIntegration("DOW_JONES_KYC", true),
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
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const createTemplatesOverviewReportTask = mutationField(
  "createTemplatesOverviewReportTask",
  {
    description: "Creates a task for generating an overview report of logged user's templates",
    type: "Task",
    authorize: authenticateAnd(contextUserHasPermission("REPORTS:OVERVIEW")),
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
        `User:${ctx.user!.id}`,
      );
    },
  },
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
      "TEMPLATE_REPLIES_CSV_EXPORT",
      "BACKGROUND_CHECK_PROFILE_PDF",
    ]),
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
      | Task<"DOW_JONES_PROFILE_DOWNLOAD">
      | Task<"TEMPLATE_REPLIES_CSV_EXPORT">
      | Task<"BACKGROUND_CHECK_PROFILE_PDF">;

    const file = isNonNullish(task.output)
      ? await ctx.files.loadTemporaryFile(task.output.temporary_file_id)
      : null;

    if (
      !file ||
      // temporary files are deleted after 30 days on S3 bucket
      differenceInDays(new Date(), file.created_at) >= 30
    ) {
      throw new ApolloError(
        `Temporary file not found for Task:${task.id} output`,
        "FILE_NOT_FOUND_ERROR",
      );
    }

    return {
      url: await ctx.storage.temporaryFiles.getSignedDownloadEndpoint(
        file.path,
        file.filename,
        args.preview ? "inline" : "attachment",
      ),
      filename: file.filename,
    };
  },
});

export const uploadBulkPetitionSendTaskInputFile = mutationField(
  "uploadBulkPetitionSendTaskInputFile",
  {
    type: "JSONObject",
    authorize: authenticateAnd(userHasFeatureFlag("BULK_PETITION_SEND_TASK")),
    args: {
      file: nonNull("FileUploadInput"),
    },
    validateArgs: validFileUploadInput("file", {
      contentType: "text/csv",
      maxSizeBytes: toBytes(10, "MB"),
    }),
    resolve: async (_, args, ctx) => {
      const { filename, size, contentType } = args.file;
      const key = random(16);
      const temporaryFile = await ctx.files.createTemporaryFile(
        {
          path: key,
          filename,
          size: size.toString(),
          content_type: contentType,
        },
        `User:${ctx.user!.id}`,
      );

      const presignedPostData = await ctx.storage.temporaryFiles.getSignedUploadEndpoint(
        key,
        contentType,
        size,
      );

      return { temporaryFileId: toGlobalId("FileUpload", temporaryFile.id), presignedPostData };
    },
  },
);

export const createBulkPetitionSendTask = mutationField("createBulkPetitionSendTask", {
  description: "Creates a Task for creating, prefilling and sending petitions from a templateId",
  type: "Task",
  authorize: authenticateAnd(
    contextUserHasPermission("PETITIONS:CREATE_PETITIONS"),
    userHasFeatureFlag("BULK_PETITION_SEND_TASK"),
    userHasAccessToPetitions("templateId"),
    petitionIsNotAnonymized("templateId"),
    petitionsAreOfTypeTemplate("templateId"),
    petitionHasRepliableFields("templateId"),
    petitionsHaveEnabledInteractionWithRecipients("templateId"),
  ),
  args: {
    templateId: nonNull(globalIdArg("Petition")),
    temporaryFileId: nonNull(globalIdArg("FileUpload")),
  },
  resolve: async (_, { templateId, temporaryFileId }, ctx) => {
    return await ctx.tasks.createTask(
      {
        name: "BULK_PETITION_SEND",
        user_id: ctx.user!.id,
        input: {
          template_id: templateId,
          temporary_file_id: temporaryFileId,
        },
      },
      `User:${ctx.user!.id}`,
    );
  },
});

export const createTemplateRepliesCsvExportTask = mutationField(
  "createTemplateRepliesCsvExportTask",
  {
    description: "Creates a Task for generating a CSV file with the replies of a template",
    type: "Task",
    authorize: authenticateAnd(
      userHasFeatureFlag("TEMPLATE_REPLIES_CSV_EXPORT_TASK"),
      userHasAccessToPetitions("templateId"),
      petitionIsNotAnonymized("templateId"),
      petitionsAreOfTypeTemplate("templateId"),
    ),
    args: {
      templateId: nonNull(globalIdArg("Petition")),
    },
    resolve: async (_, { templateId }, ctx) => {
      return await ctx.tasks.createTask(
        {
          name: "TEMPLATE_REPLIES_CSV_EXPORT",
          user_id: ctx.user!.id,
          input: {
            template_id: templateId,
          },
        },
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const createPetitionSummaryTask = mutationField("createPetitionSummaryTask", {
  description: "Creates a Task for generating a petition summary with AI",
  type: "Task",
  authorize: authenticateAnd(
    userHasFeatureFlag("PETITION_SUMMARY"),
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreOfTypePetition("petitionId"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
  },
  resolve: async (_, { petitionId }, ctx) => {
    return await ctx.tasks.createTask(
      {
        name: "PETITION_SUMMARY",
        user_id: ctx.user!.id,
        input: {
          petition_id: petitionId,
        },
      },
      `User:${ctx.user!.id}`,
    );
  },
});

export const createBackgroundCheckProfilePdfTask = mutationField(
  "createBackgroundCheckProfilePdfTask",
  {
    type: "Task",
    authorize: authenticateAnd(
      userHasFeatureFlag("BACKGROUND_CHECK"),
      authenticateBackgroundCheckToken("token"),
    ),
    args: {
      token: nonNull(stringArg()),
      entityId: nonNull(stringArg()),
    },
    resolve: async (_, args, ctx) => {
      return await ctx.tasks.createTask(
        {
          name: "BACKGROUND_CHECK_PROFILE_PDF",
          user_id: ctx.user!.id,
          input: {
            token: args.token,
            entity_id: args.entityId,
          },
        },
        `User:${ctx.user!.id}`,
      );
    },
  },
);

export const createFileExportTask = mutationField("createFileExportTask", {
  description: "Creates a task for exporting files from a petition using an integration",
  type: "Task",
  authorize: authenticateAnd(
    userHasAccessToPetitions("petitionId"),
    petitionIsNotAnonymized("petitionId"),
    petitionsAreOfTypePetition("petitionId"),
    userHasAccessToIntegrations("integrationId", ["FILE_EXPORT"], true),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    integrationId: nonNull(globalIdArg("OrgIntegration")),
    pattern: nullable(stringArg()),
  },
  resolve: async (_, args, ctx) => {
    return await ctx.tasks.createTask(
      {
        name: "FILE_EXPORT",
        user_id: ctx.user!.id,
        input: {
          petition_id: args.petitionId,
          integration_id: args.integrationId,
          pattern: args.pattern ?? null,
        },
      },
      `User:${ctx.user!.id}`,
    );
  },
});

export const createAddPetitionPermissionMaybeTask = mutationField(
  "createAddPetitionPermissionMaybeTask",
  {
    type: "MaybeTask",
    description: outdent`
    Adds permissions to users and groups on given petitions and folders.
    If the total amount of permission to add exceeds 200, a task will be created for async completion.
    If user does not have OWNER or WRITE access on some of the provided petitions, those will be ignored.

    If the total amount of permissions to add is less than 200, it will execute synchronously and return a status code.
    Otherwise, it will create and enqueue a Task to be executed asynchronously; and return the Task object.
  `,
    authorize: authenticateAnd(
      ifArgDefined("petitionIds", userHasAccessToPetitions("petitionIds" as never)),
      userHasAccessToUsers("userIds"),
      userHasAccessToUserGroups("userGroupIds"),
    ),
    args: {
      petitionIds: list(nonNull(globalIdArg("Petition"))),
      folders: "FoldersInput",
      userIds: list(nonNull(globalIdArg("User"))),
      userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
      permissionType: nonNull(arg({ type: "PetitionPermissionTypeRW" })),
      notify: booleanArg({
        description: "Wether to notify the user via email or not.",
        default: false,
      }),
      subscribe: booleanArg({
        description: "Subscribe to notifications.",
        default: true,
      }),
      message: stringArg(),
    },
    validateArgs: validateAnd(
      notEmptyArray("petitionIds"),
      notEmptyArray("folders.folderIds"),
      notEmptyArray("userIds"),
      notEmptyArray("userGroupIds"),
      maxLength("message", 1000),
      (_, args, ctx, info) => {
        if (isNullish(args.userIds) && isNullish(args.userGroupIds)) {
          throw new ArgValidationError(
            info,
            "userIds, userGroupIds",
            "Either userIds or userGroupIds must be defined",
          );
        }
        if (isNullish(args.folders) && isNullish(args.petitionIds)) {
          throw new ArgValidationError(
            info,
            "folders, petitionIds",
            "Either folders or petitionIds must be defined",
          );
        }
      },
    ),
    resolve: async (_, args, ctx) => {
      const petitionIds = await ctx.petitions.getPetitionIdsWithUserPermissions(
        args.petitionIds ?? [],
        args.folders?.folderIds ?? [],
        args.folders?.type === "TEMPLATE",
        ctx.user!,
        ["OWNER", "WRITE"],
      );

      const groupMembers = isNonNullish(args.userGroupIds)
        ? await ctx.userGroups.loadUserGroupMemberCount(args.userGroupIds)
        : [0];

      const totalAffectedRows =
        petitionIds.length *
        ((args.userIds?.length ?? 0) + // directly-inserted users
          (args.userGroupIds?.length ?? 0) + // directly-inserted groups
          sumBy(groupMembers, (m) => m)); // user members inserted through groups

      if (totalAffectedRows <= 200) {
        const permissionsBefore = (
          await ctx.petitions.loadEffectivePermissions(petitionIds)
        ).flat();

        const newPermissions = await ctx.petitions.addPetitionPermissions(
          petitionIds,
          [
            ...(args.userIds ?? []).map((userId) => ({
              type: "User" as const,
              id: userId,
              isSubscribed: args.subscribe ?? true,
              permissionType: args.permissionType,
            })),
            ...(args.userGroupIds ?? []).map((userGroupId) => ({
              type: "UserGroup" as const,
              id: userGroupId,
              isSubscribed: args.subscribe ?? true,
              permissionType: args.permissionType,
            })),
          ],
          "User",
          ctx.user!.id,
          true,
        );

        if (args.notify) {
          const newUserPermissions = pipe(
            newPermissions,
            filter((p) => isNonNullish(p.user_id)),
            // remove duplicated <user_id,petition_id> entries to send only one email per user/petition
            uniqueBy((p) => `${p.user_id}:${p.petition_id}`),
            // omit users who had access previously
            differenceWith(
              permissionsBefore,
              (p1, p2) => p1.petition_id === p2.petition_id && p1.user_id === p2.user_id,
            ),
          );

          if (newUserPermissions.length > 0) {
            await ctx.emails.sendPetitionSharedEmail(
              ctx.user!.id,
              newUserPermissions.map((p) => p.id),
              args.message ?? null,
            );
          }
        }

        return {
          status: "COMPLETED",
        };
      } else {
        return {
          status: "PROCESSING",
          task: await ctx.tasks.createTask(
            {
              name: "PETITION_SHARING",
              user_id: ctx.user!.id,
              input: {
                action: "ADD",
                petition_ids: args.petitionIds,
                folders: args.folders,
                user_ids: args.userIds,
                user_group_ids: args.userGroupIds,
                permission_type: args.permissionType,
                notify: args.notify,
                subscribe: args.subscribe,
                message: args.message,
              },
            },
            `User:${ctx.user!.id}`,
          ),
        };
      }
    },
  },
);

export const createEditPetitionPermissionMaybeTask = mutationField(
  "createEditPetitionPermissionMaybeTask",
  {
    description: outdent`
    Edits permissions to users and groups on given petitions.
    If the total amount of permissions to edit exceeds 200, a task will be created for async completion.

    If the total amount of permissions to add is less than 200, it will execute synchronously and return a status code.
    Otherwise, it will create and enqueue a Task to be executed asynchronously; and return the Task object.
  `,
    type: "MaybeTask",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionIds", ["OWNER", "WRITE"]),
      userHasAccessToUsers("userIds"),
      userHasAccessToUserGroups("userGroupIds"),
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: list(nonNull(globalIdArg("User"))),
      userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
      permissionType: nonNull(arg({ type: "PetitionPermissionTypeRW" })),
    },
    validateArgs: validateAnd(
      notEmptyArray("petitionIds"),
      notEmptyArray("userIds"),
      notEmptyArray("userGroupIds"),
      (_, args, ctx, info) => {
        if (isNullish(args.userIds) && isNullish(args.userGroupIds)) {
          throw new ArgValidationError(
            info,
            "userIds, userGroupIds",
            "Either userIds or userGroupIds must be defined",
          );
        }
      },
    ),
    resolve: async (_, args, ctx) => {
      const groupMembers = isNonNullish(args.userGroupIds)
        ? await ctx.userGroups.loadUserGroupMemberCount(args.userGroupIds)
        : [0];

      const totalAffectedRows =
        args.petitionIds.length *
        ((args.userIds?.length ?? 0) + // directly-inserted users
          (args.userGroupIds?.length ?? 0) + // directly-inserted groups
          sumBy(groupMembers, (m) => m)); // user members inserted through groups

      if (totalAffectedRows <= 200) {
        await ctx.petitions.editPetitionPermissions(
          args.petitionIds,
          args.userIds ?? [],
          args.userGroupIds ?? [],
          args.permissionType,
          ctx.user!,
        );
        return {
          status: "COMPLETED",
        };
      } else {
        return {
          status: "PROCESSING",
          task: await ctx.tasks.createTask(
            {
              name: "PETITION_SHARING",
              user_id: ctx.user!.id,
              input: {
                action: "EDIT",
                petition_ids: args.petitionIds,
                user_ids: args.userIds,
                user_group_ids: args.userGroupIds,
                permission_type: args.permissionType,
              },
            },
            `User:${ctx.user!.id}`,
          ),
        };
      }
    },
  },
);

export const createRemovePetitionPermissionMaybeTask = mutationField(
  "createRemovePetitionPermissionMaybeTask",
  {
    description: outdent`
      Removes permissions to users and groups on given petitions.
      If the total amount of permission to add exceeds 200, a task will be created for async completion.

      If the total amount of permissions to add is less than 200, it will execute synchronously and return a status code.
      Otherwise, it will create and enqueue a Task to be executed asynchronously; and return the Task object.
    `,
    type: "MaybeTask",
    authorize: authenticateAnd(
      userHasAccessToPetitions("petitionIds", ["OWNER", "WRITE"]),
      userHasAccessToUsers("userIds"),
      userHasAccessToUserGroups("userGroupIds"),
    ),
    args: {
      petitionIds: nonNull(list(nonNull(globalIdArg("Petition")))),
      userIds: list(nonNull(globalIdArg("User"))),
      userGroupIds: list(nonNull(globalIdArg("UserGroup"))),
      removeAll: booleanArg({
        description:
          "Set to true if you want to remove all permissions on the petitions. This will ignore the provided userIds",
      }),
    },
    validateArgs: validateAnd(
      notEmptyArray("petitionIds"),
      notEmptyArray("userIds"),
      notEmptyArray("userGroupIds"),
      (_, args, ctx, info) => {
        if (!args.removeAll && isNullish(args.userIds) && isNullish(args.userGroupIds)) {
          throw new ArgValidationError(
            info,
            "userIds, userGroupIds",
            "Either userIds or userGroupIds must be defined",
          );
        }
      },
      validateIf(
        (args) => isNullish(args.userIds) && isNullish(args.userGroupIds),
        validBooleanValue("removeAll", true),
      ),
    ),
    resolve: async (_, args, ctx) => {
      const groupMembers = isNonNullish(args.userGroupIds)
        ? await ctx.userGroups.loadUserGroupMemberCount(args.userGroupIds)
        : [0];

      const totalAffectedRows =
        args.petitionIds.length *
        ((args.userIds?.length ?? 0) + // directly-inserted users
          (args.userGroupIds?.length ?? 0) + // directly-inserted groups
          sumBy(groupMembers, (m) => m)); // user members inserted through groups

      if (totalAffectedRows <= 200) {
        const deletedPermissions = await ctx.petitions.removePetitionPermissions(
          args.petitionIds,
          args.userIds ?? [],
          args.userGroupIds ?? [],
          args.removeAll ?? false,
          ctx.user!,
        );
        const deletedPermissionsByPetitionId = groupBy(deletedPermissions, (p) => p.petition_id);

        const deletedPetitionIds = unique(deletedPermissions.map((p) => p.petition_id));

        const effectivePermissions =
          await ctx.petitions.loadEffectivePermissions(deletedPetitionIds);

        // For each petition, delete permissions not present in effectivePermissions
        await pMap(
          zip(
            deletedPetitionIds.map((id) => deletedPermissionsByPetitionId[id]),
            effectivePermissions,
          ),
          async ([deletedPermissions, effectivePermissions]) => {
            const petitionId = deletedPermissions[0].petition_id;
            const hasPermissions = new Set(effectivePermissions.map((p) => p.user_id!));

            // users of deletedPermissions that dont have any effectivePermission lost
            // access to the petitions, their notifications need to be deleted
            const userIds = unique(
              deletedPermissions
                .filter((p) => p.user_id !== null)
                .map((p) => p.user_id!)
                .filter((userId) => !hasPermissions.has(userId)),
            );

            await ctx.petitions.deletePetitionUserNotificationsByPetitionId([petitionId], userIds);
          },
          { concurrency: 20 },
        );

        return {
          status: "COMPLETED",
        };
      } else {
        return {
          status: "PROCESSING",
          task: await ctx.tasks.createTask(
            {
              name: "PETITION_SHARING",
              user_id: ctx.user!.id,
              input: {
                action: "REMOVE",
                petition_ids: args.petitionIds,
                user_ids: args.userIds,
                user_group_ids: args.userGroupIds,
                remove_all: args.removeAll,
              },
            },
            `User:${ctx.user!.id}`,
          ),
        };
      }
    },
  },
);

export const createProfilesExcelImportTask = mutationField("createProfilesExcelImportTask", {
  description: "Creates a task for importing profiles from an excel file",
  type: "Task",
  authorize: authenticateAnd(userHasAccessToProfileType("profileTypeId")),
  args: {
    profileTypeId: nonNull(globalIdArg("ProfileType")),
    file: nonNull(uploadArg()),
  },
  validateArgs: validateFile("file", {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxSize: 1024 * 1024 * 10,
  }),
  resolve: async (_, args, ctx) => {
    const file = await args.file;

    const [importError, importData] = await withError(importFromExcel(file.createReadStream()));
    if (importError) {
      throw new ApolloError("Invalid file", "INVALID_FILE_ERROR");
    }

    try {
      // catch any parsing error before starting the task
      await ctx.profileImport.parseAndValidateExcelData(
        args.profileTypeId,
        importData,
        ctx.user!.id,
      );

      // all good, create a temporary file with data and start the task
      const path = random(16);
      const uploadResponse = await ctx.storage.temporaryFiles.uploadFile(
        path,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        file.createReadStream(),
      );
      const tmpFile = await ctx.files.createTemporaryFile(
        {
          content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          filename: file.filename,
          path,
          size: uploadResponse["ContentLength"]?.toString() ?? "0",
        },
        `User:${ctx.user!.id}`,
      );

      return await ctx.tasks.createTask(
        {
          name: "PROFILES_EXCEL_IMPORT",
          input: {
            profile_type_id: args.profileTypeId,
            temporary_file_id: tmpFile.id,
          },
          user_id: ctx.user!.id,
        },
        `User:${ctx.user!.id}`,
      );
    } catch (error) {
      if (error instanceof InvalidDataError) {
        throw new ApolloError(error.message, "INVALID_FILE_ERROR");
      }
      if (error instanceof CellError) {
        throw new ApolloError(error.message, "INVALID_CELL_ERROR", {
          cell: error.cell,
        });
      }
      if (error instanceof UnknownIdError) {
        throw new ApolloError(error.message, "INVALID_CELL_ERROR", {
          cell: {
            col: importData[1].indexOf(error.id) + 1,
            row: 2,
            value: error.id,
          },
        });
      }
      throw error;
    }
  },
});
