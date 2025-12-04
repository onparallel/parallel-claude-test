import { enumType, list, mutationField, nonNull, stringArg } from "nexus";
import pMap from "p-map";
import { isNonNullish, unique, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldComment } from "../../db/__types";
import { toBytes } from "../../util/fileSize";
import { fromPlainText } from "../../util/slate/utils";
import { random } from "../../util/token";
import { authenticateAnd } from "../helpers/authorize";
import { ForbiddenError } from "../helpers/errors";
import { globalIdArg } from "../helpers/globalIdPlugin";
import { uploadArg } from "../helpers/scalars/Upload";
import { validateAnd } from "../helpers/validateArgs";
import { maxArrayLength } from "../helpers/validators/maxArrayLength";
import { maxFileSize } from "../helpers/validators/maxFileSize";
import { maxLength } from "../helpers/validators/maxLength";
import {
  petitionHasStatus,
  petitionsAreNotScheduledForDeletion,
  petitionsAreOfTypePetition,
  userHasAccessToPetitions,
  userHasFeatureFlag,
} from "../petition/authorizers";
import { approvalRequestStepIsNextWithStatus } from "./authorizers";

export const cancelPetitionApprovalRequestFlow = mutationField(
  "cancelPetitionApprovalRequestFlow",
  {
    description:
      "Cancels the provided approval request step, setting it as CANCELED and effectively canceling the whole request. The step must be in PENDING status.",
    type: "PetitionApprovalRequestStep",
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_APPROVAL_FLOW"),
      petitionsAreOfTypePetition("petitionId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionHasStatus("petitionId", "COMPLETED"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
    },
    resolve: async (_, args, ctx) => {
      const [canceledStep] = await ctx.approvals.cancelApprovalRequestFlowByPetitionId(
        args.petitionId,
        ctx.user!.id,
      );

      if (!canceledStep) {
        throw new ForbiddenError("No pending or approved steps found");
      }

      // after canceling current request, we need to recreate the steps in initial state, so user is able to start again
      await ctx.approvals.startApprovalRequestFlowByPetitionId(
        args.petitionId,
        `User:${ctx.user!.id}`,
      );

      ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId.dataloader.clear(
        args.petitionId,
      );

      ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId.dataloader.clear(
        canceledStep.id,
      );

      return canceledStep;
    },
  },
);

export const startPetitionApprovalRequestStep = mutationField("startPetitionApprovalRequestStep", {
  description:
    "Starts an approval request on the provided step. The step must be applicable and next in line.",
  type: "PetitionApprovalRequestStep",
  authorize: authenticateAnd(
    userHasFeatureFlag("PETITION_APPROVAL_FLOW"),
    petitionsAreOfTypePetition("petitionId"),
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionHasStatus("petitionId", "COMPLETED"),
    approvalRequestStepIsNextWithStatus("petitionId", "approvalRequestStepId", "NOT_STARTED"),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    approvalRequestStepId: nonNull(globalIdArg("PetitionApprovalRequestStep")),
    message: stringArg(),
    attachments: list(nonNull(uploadArg())),
  },
  validateArgs: validateAnd(
    maxLength("message", 1000),
    maxFileSize("attachments", toBytes(50, "MB")),
    maxArrayLength("attachments", 10),
  ),
  resolve: async (_, args, ctx) => {
    const approvalRequestStep = await ctx.approvalRequests.updatePetitionApprovalRequestStep(
      args.approvalRequestStepId,
      { status: "PENDING" },
      `User:${ctx.user!.id}`,
    );
    assert(approvalRequestStep, "Approval request step not found");

    const approvers = await ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
      args.approvalRequestStepId,
    );

    if (approvers.length === 0) {
      return approvalRequestStep;
    }

    let comment: PetitionFieldComment | undefined;
    if (args.message && args.message !== "") {
      comment = await ctx.petitions.createPetitionFieldCommentFromUser(
        {
          petitionId: args.petitionId,
          petitionFieldId: null,
          contentJson: fromPlainText(args.message),
          isInternal: false,
          approvalMetadata: {
            stepName: approvalRequestStep.step_name,
            status: "PENDING",
          },
        },
        ctx.user!,
      );

      const files = await pMap(
        args.attachments ?? [],
        async (attachment) => {
          const { mimetype, filename, createReadStream } = await attachment;
          const path = random(16);

          const res = await ctx.storage.fileUploads.uploadFile(path, mimetype, createReadStream());
          const [file] = await ctx.files.createFileUpload(
            {
              path,
              filename,
              content_type: mimetype,
              size: res["ContentLength"]!.toString(),
              upload_complete: true,
            },
            `User:${ctx.user!.id}`,
          );

          return file;
        },
        { concurrency: 1 },
      );

      await ctx.petitionComments.createPetitionCommentAttachment(
        files.map((file) => ({ petition_comment_id: comment!.id, file_upload_id: file.id })),
        `User:${ctx.user!.id}`,
      );
    }

    await ctx.approvalRequests.updatePetitionApprovalRequestStepApproverTimestamps(
      approvers.map((a) => a.id),
      { sent: true },
      `User:${ctx.user!.id}`,
    );

    // make sure everybody has at least READ access
    const newPermissions = await ctx.petitions.ensureMinimalPermissions(
      args.petitionId,
      approvers.map((a) => a.user_id),
      `User:${ctx.user!.id}`,
    );

    await ctx.petitions.createEvent(
      newPermissions.map((p) => ({
        type: "USER_PERMISSION_ADDED",
        petition_id: args.petitionId,
        data: {
          permission_user_id: p.user_id!,
          permission_type: p.type,
          user_id: ctx.user!.id,
        },
      })),
    );

    await ctx.emails.sendPetitionApprovalRequestStepPendingEmail(
      approvalRequestStep.id,
      comment?.id ?? null,
      ctx.user!.id,
    );

    await ctx.petitions.createEvent({
      type: "PETITION_APPROVAL_REQUEST_STEP_STARTED",
      petition_id: args.petitionId,
      data: {
        petition_approval_request_step_id: approvalRequestStep.id,
        petition_comment_id: comment?.id ?? null,
        user_id: ctx.user!.id,
      },
    });

    ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId.dataloader.clear(
      args.petitionId,
    );
    ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId.dataloader.clear(
      args.approvalRequestStepId,
    );

    return approvalRequestStep;
  },
});

export const skipPetitionApprovalRequestStep = mutationField("skipPetitionApprovalRequestStep", {
  description:
    "Skips the provided approval request step. Step must be in NOT_STARTED or PENDING status.",
  type: "PetitionApprovalRequestStep",
  authorize: authenticateAnd(
    userHasFeatureFlag("PETITION_APPROVAL_FLOW"),
    petitionsAreOfTypePetition("petitionId"),
    userHasAccessToPetitions("petitionId"),
    petitionsAreNotScheduledForDeletion("petitionId"),
    petitionHasStatus("petitionId", "COMPLETED"),
    approvalRequestStepIsNextWithStatus("petitionId", "approvalRequestStepId", [
      "NOT_STARTED",
      "PENDING",
    ]),
  ),
  args: {
    petitionId: nonNull(globalIdArg("Petition")),
    approvalRequestStepId: nonNull(globalIdArg("PetitionApprovalRequestStep")),
    message: nonNull(stringArg()),
  },
  validateArgs: maxLength("message", 1000),
  resolve: async (_, args, ctx) => {
    const approvalRequestStep = await ctx.approvalRequests.updatePetitionApprovalRequestStep(
      args.approvalRequestStepId,
      { status: "SKIPPED" },
      `User:${ctx.user!.id}`,
    );
    assert(approvalRequestStep, "Approval request step not found");

    const approvers = await ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
      approvalRequestStep.id,
    );
    const stepApprover = approvers.find((a) => a.user_id === ctx.user!.id);
    if (stepApprover) {
      await ctx.approvalRequests.updatePetitionApprovalRequestStepApproverTimestamps(
        stepApprover.id,
        { skipped: true },
        `User:${ctx.user!.id}`,
      );
    } else {
      // insert context user as a new approver, so it can be marked as the approver who skipped this step
      await ctx.approvalRequests.createPetitionApprovalRequestStepApprovers(
        approvalRequestStep.id,
        [{ id: ctx.user!.id, skipped: true }],
        `User:${ctx.user!.id}`,
      );
    }

    const comment = await ctx.petitions.createPetitionFieldCommentFromUser(
      {
        petitionId: args.petitionId,
        petitionFieldId: null,
        contentJson: fromPlainText(args.message),
        isInternal: false,
        approvalMetadata: {
          stepName: approvalRequestStep.step_name,
          status: "SKIPPED",
        },
      },
      ctx.user!,
    );

    await ctx.petitions.createEvent({
      type: "PETITION_APPROVAL_REQUEST_STEP_SKIPPED",
      petition_id: args.petitionId,
      data: {
        petition_approval_request_step_id: approvalRequestStep.id,
        petition_comment_id: comment.id,
        user_id: ctx.user!.id,
      },
    });

    ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId.dataloader.clear(
      args.petitionId,
    );
    ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId.dataloader.clear(
      args.approvalRequestStepId,
    );

    return approvalRequestStep;
  },
});

export const cancelPetitionApprovalRequestStep = mutationField(
  "cancelPetitionApprovalRequestStep",
  {
    description:
      "Cancels the provided approval request step, setting it as NOT_STARTED. The step must be in PENDING status.",
    type: "PetitionApprovalRequestStep",
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_APPROVAL_FLOW"),
      petitionsAreOfTypePetition("petitionId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionHasStatus("petitionId", "COMPLETED"),
      approvalRequestStepIsNextWithStatus("petitionId", "approvalRequestStepId", ["PENDING"]),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      approvalRequestStepId: nonNull(globalIdArg("PetitionApprovalRequestStep")),
    },
    resolve: async (_, args, ctx) => {
      const approvalRequestStep = await ctx.approvalRequests.updatePetitionApprovalRequestStep(
        args.approvalRequestStepId,
        { status: "NOT_STARTED" },
        `User:${ctx.user!.id}`,
      );
      assert(approvalRequestStep, "Approval request step not found");

      await ctx.approvalRequests.restartPetitionApprovalRequestStepApproversByStepId(
        args.approvalRequestStepId,
        `User:${ctx.user!.id}`,
      );

      await ctx.emails.sendPetitionApprovalRequestStepCanceledEmail(
        approvalRequestStep.id,
        ctx.user!.id,
      );

      await ctx.petitions.createEvent({
        type: "PETITION_APPROVAL_REQUEST_STEP_CANCELED",
        petition_id: args.petitionId,
        data: {
          petition_approval_request_step_id: approvalRequestStep.id,
          user_id: ctx.user!.id,
        },
      });

      ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId.dataloader.clear(
        args.petitionId,
      );

      return approvalRequestStep;
    },
  },
);

export const sendPetitionApprovalRequestStepReminder = mutationField(
  "sendPetitionApprovalRequestStepReminder",
  {
    description:
      "Sends a reminder to the pending approvers of the provided approval request step. The step must be in PENDING status.",
    type: "PetitionApprovalRequestStep",
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_APPROVAL_FLOW"),
      petitionsAreOfTypePetition("petitionId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionHasStatus("petitionId", "COMPLETED"),
      approvalRequestStepIsNextWithStatus("petitionId", "approvalRequestStepId", "PENDING"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      approvalRequestStepId: nonNull(globalIdArg("PetitionApprovalRequestStep")),
    },
    resolve: async (_, args, ctx) => {
      const approvalRequestStep = await ctx.approvalRequests.loadPetitionApprovalRequestStep(
        args.approvalRequestStepId,
      );
      assert(approvalRequestStep, "Approval request step not found");

      await ctx.emails.sendPetitionApprovalRequestStepReminderEmail(
        approvalRequestStep.id,
        ctx.user!.id,
      );

      await ctx.petitions.createEvent({
        type: "PETITION_APPROVAL_REQUEST_STEP_REMINDER",
        petition_id: args.petitionId,
        data: {
          user_id: ctx.user!.id,
          petition_approval_request_step_id: approvalRequestStep.id,
        },
      });

      return approvalRequestStep;
    },
  },
);

export const approvePetitionApprovalRequestStep = mutationField(
  "approvePetitionApprovalRequestStep",
  {
    description: "Approves the current approval request step. The step must be in PENDING status.",
    type: "PetitionApprovalRequestStep",
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_APPROVAL_FLOW"),
      petitionsAreOfTypePetition("petitionId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionHasStatus("petitionId", "COMPLETED"),
      approvalRequestStepIsNextWithStatus("petitionId", "approvalRequestStepId", "PENDING"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      approvalRequestStepId: nonNull(globalIdArg("PetitionApprovalRequestStep")),
      message: nonNull(stringArg()),
      attachments: list(nonNull(uploadArg())),
    },
    validateArgs: validateAnd(
      maxLength("message", 1000),
      maxFileSize("attachments", toBytes(50, "MB")),
      maxArrayLength("attachments", 10),
    ),
    resolve: async (_, args, ctx) => {
      let approvalRequestStep = await ctx.approvalRequests.loadPetitionApprovalRequestStep(
        args.approvalRequestStepId,
      );
      assert(approvalRequestStep, "Approval request step not found");

      const approvers = await ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
        approvalRequestStep.id,
      );

      const approver = approvers.find((a) => a.user_id === ctx.user!.id)!;
      if (!approver) {
        throw new ForbiddenError("User is not a defined approver of the current step");
      }
      if (isNonNullish(approver.approved_at) || isNonNullish(approver.rejected_at)) {
        throw new ForbiddenError("User has already approved or rejected the current step");
      }
      const otherApprovers = approvers.filter((a) => a.user_id !== ctx.user!.id);
      await ctx.approvalRequests.updatePetitionApprovalRequestStepApproverTimestamps(
        approver.id,
        { approved: true },
        `User:${ctx.user!.id}`,
      );

      const comment = await ctx.petitions.createPetitionFieldCommentFromUser(
        {
          petitionId: args.petitionId,
          petitionFieldId: null,
          contentJson: fromPlainText(args.message),
          isInternal: false,
          approvalMetadata: {
            stepName: approvalRequestStep.step_name,
            status: "APPROVED",
          },
        },
        ctx.user!,
      );

      const files = await pMap(
        args.attachments ?? [],
        async (attachment) => {
          const { mimetype, filename, createReadStream } = await attachment;
          const path = random(16);

          const res = await ctx.storage.fileUploads.uploadFile(path, mimetype, createReadStream());
          const [file] = await ctx.files.createFileUpload(
            {
              path,
              filename,
              content_type: mimetype,
              size: res["ContentLength"]!.toString(),
              upload_complete: true,
            },
            `User:${ctx.user!.id}`,
          );

          return file;
        },
        { concurrency: 1 },
      );

      await ctx.petitionComments.createPetitionCommentAttachment(
        files.map((file) => ({ petition_comment_id: comment.id, file_upload_id: file.id })),
        `User:${ctx.user!.id}`,
      );

      await ctx.petitions.createEvent({
        type: "PETITION_APPROVAL_REQUEST_STEP_APPROVED",
        petition_id: args.petitionId,
        data: {
          petition_approval_request_step_id: approvalRequestStep.id,
          user_id: ctx.user!.id,
        },
      });

      if (
        approvalRequestStep.approval_type === "ANY" ||
        otherApprovers.every((a) => isNonNullish(a.approved_at))
      ) {
        approvalRequestStep = (await ctx.approvalRequests.updatePetitionApprovalRequestStep(
          approvalRequestStep.id,
          { status: "APPROVED" },
          `User:${ctx.user!.id}`,
        ))!;

        await ctx.emails.sendPetitionApprovalRequestStepApprovedEmail(
          approvalRequestStep.id,
          comment.id,
          ctx.user!.id,
        );

        await ctx.petitions.createEvent({
          type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
          petition_id: args.petitionId,
          data: {
            petition_approval_request_step_id: approvalRequestStep.id,
            user_id: ctx.user!.id,
          },
        });
      }

      ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId.dataloader.clear(
        args.petitionId,
      );
      ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId.dataloader.clear(
        args.approvalRequestStepId,
      );

      return approvalRequestStep;
    },
  },
);

export const rejectPetitionApprovalRequestStep = mutationField(
  "rejectPetitionApprovalRequestStep",
  {
    description: "Rejects the current approval request step. Step must be in PENDING status.",
    type: "PetitionApprovalRequestStep",
    authorize: authenticateAnd(
      userHasFeatureFlag("PETITION_APPROVAL_FLOW"),
      petitionsAreOfTypePetition("petitionId"),
      userHasAccessToPetitions("petitionId"),
      petitionsAreNotScheduledForDeletion("petitionId"),
      petitionHasStatus("petitionId", "COMPLETED"),
      approvalRequestStepIsNextWithStatus("petitionId", "approvalRequestStepId", "PENDING"),
    ),
    args: {
      petitionId: nonNull(globalIdArg("Petition")),
      approvalRequestStepId: nonNull(globalIdArg("PetitionApprovalRequestStep")),
      message: nonNull(stringArg()),
      attachments: list(nonNull(uploadArg())),
      rejectionType: nonNull(
        enumType({
          name: "PetitionApprovalRequestStepRejectionType",
          members: ["TEMPORARY", "DEFINITIVE"],
        }),
      ),
    },
    validateArgs: validateAnd(
      maxLength("message", 1000),
      maxFileSize("attachments", toBytes(50, "MB")),
      maxArrayLength("attachments", 10),
    ),
    resolve: async (_, args, ctx) => {
      const approvers = await ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(
        args.approvalRequestStepId,
      );

      const approver = approvers.find((a) => a.user_id === ctx.user!.id)!;
      if (!approver) {
        throw new ForbiddenError("User is not a defined approver of the current step");
      }
      if (isNonNullish(approver.approved_at) || isNonNullish(approver.rejected_at)) {
        throw new ForbiddenError("User has already approved or rejected the current step");
      }

      const approvalRequestStep = await ctx.approvalRequests.updatePetitionApprovalRequestStep(
        args.approvalRequestStepId,
        { status: "REJECTED" },
        `User:${ctx.user!.id}`,
      );
      assert(approvalRequestStep, "Approval request step not found");

      await ctx.approvalRequests.updatePetitionApprovalRequestStepApproverTimestamps(
        approver.id,
        { rejected: true },
        `User:${ctx.user!.id}`,
      );

      const comment = await ctx.petitions.createPetitionFieldCommentFromUser(
        {
          petitionId: args.petitionId,
          petitionFieldId: null,
          contentJson: fromPlainText(args.message),
          isInternal: false,
          approvalMetadata: {
            stepName: approvalRequestStep.step_name,
            status: "REJECTED",
            rejectionType: args.rejectionType,
          },
        },
        ctx.user!,
      );

      const files = await pMap(
        args.attachments ?? [],
        async (attachment) => {
          const { mimetype, filename, createReadStream } = await attachment;
          const path = random(16);

          const res = await ctx.storage.fileUploads.uploadFile(path, mimetype, createReadStream());
          const [file] = await ctx.files.createFileUpload(
            {
              path,
              filename,
              content_type: mimetype,
              size: res["ContentLength"]!.toString(),
              upload_complete: true,
            },
            `User:${ctx.user!.id}`,
          );

          return file;
        },
        { concurrency: 1 },
      );

      await ctx.petitionComments.createPetitionCommentAttachment(
        files.map((file) => ({ petition_comment_id: comment.id, file_upload_id: file.id })),
        `User:${ctx.user!.id}`,
      );

      await ctx.petitions.createEvent({
        type: "PETITION_APPROVAL_REQUEST_STEP_REJECTED",
        petition_id: args.petitionId,
        data: {
          petition_approval_request_step_id: approvalRequestStep.id,
          petition_comment_id: comment.id,
          user_id: ctx.user!.id,
        },
      });

      await ctx.emails.sendPetitionApprovalRequestStepRejectedEmail(
        approvalRequestStep.id,
        args.rejectionType,
        comment.id,
        ctx.user!.id,
      );

      await ctx.petitions.createEvent({
        type: "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
        petition_id: args.petitionId,
        data: {
          petition_approval_request_step_id: approvalRequestStep.id,
          user_id: ctx.user!.id,
        },
      });

      if (args.rejectionType === "TEMPORARY") {
        const [deprecatedSteps] =
          await ctx.approvalRequests.updatePetitionApprovalRequestStepsAsDeprecated(
            args.petitionId,
          );

        // after canceling current request, we need to recreate the steps in initial state, so user is able to start again
        const newSteps = await ctx.approvalRequests.createPetitionApprovalRequestSteps(
          deprecatedSteps.map((s) => ({
            approval_type: s.approval_type,
            step_name: s.step_name,
            petition_id: s.petition_id,
            status: s.status === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "NOT_STARTED",
            step_number: s.step_number,
          })),
          `User:${ctx.user!.id}`,
        );

        // on each step, insert its approvers
        const petition = await ctx.petitions.loadPetition(args.petitionId);
        assert(petition?.approval_flow_config);
        for (const [step, config] of zip(newSteps, petition.approval_flow_config)) {
          const userGroupsIds = config.values
            .filter((v) => v.type === "UserGroup")
            .map((v) => v.id);
          const groupMembers = (await ctx.userGroups.loadUserGroupMembers(userGroupsIds)).flat();
          const userIds = unique([
            ...config.values.filter((v) => v.type === "User").map((v) => v.id),
            ...groupMembers.map((m) => m.user_id),
          ]);

          await ctx.approvalRequests.createPetitionApprovalRequestStepApprovers(
            step.id,
            userIds.map((id) => ({ id })),
            `User:${ctx.user!.id}`,
          );
        }
      }

      ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId.dataloader.clear(
        args.petitionId,
      );
      ctx.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId.dataloader.clear(
        args.approvalRequestStepId,
      );

      return approvalRequestStep;
    },
  },
);
