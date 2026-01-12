import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { findLast, isNonNullish, unique, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionApprovalRequestStep, PetitionApprovalRequestStepStatus } from "../db/__types";
import {
  ApprovalRequestStepConfig,
  PetitionApprovalRequestRepository,
} from "../db/repositories/PetitionApprovalRequestRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { UserGroupRepository } from "../db/repositories/UserGroupRepository";
import { evaluateVisibilityArray } from "../util/fieldLogic";
import { MaybeArray, unMaybeArray } from "../util/types";
import { EMAILS, IEmailsService } from "./EmailsService";

export const APPROVALS_SERVICE = Symbol("APPROVALS_SERVICE");

export interface IApprovalsService {
  /**
   * starts an approval request flow, if the petition has a set configuration.
   * This will create the steps and approvers for the petition, and set the step statuses to NOT_STARTED or NOT_APPLICABLE.
   */
  startApprovalRequestFlowByPetitionId(
    petitionId: number,
    userId: number | null,
    startedBy: string,
    opts?: {
      /** Whether to start the first step manually, even if its configured to start automatically. */
      forceStartFirstStepManually: boolean;
    },
  ): Promise<void>;
  cancelApprovalRequestFlowByPetitionId(
    petitionId: MaybeArray<number>,
    userId: number,
    opts?: { onlyIfPending?: boolean },
    t?: Knex.Transaction,
  ): Promise<(PetitionApprovalRequestStep | null)[]>;
  startApprovalRequestStep(
    stepId: number,
    commentId?: number | null,
    userId?: number | null,
  ): Promise<PetitionApprovalRequestStep>;
  extractUserIdsFromApprovalFlowConfig(config: ApprovalRequestStepConfig): Promise<number[]>;
}

@injectable()
export class ApprovalsService implements IApprovalsService {
  constructor(
    @inject(EMAILS) private emails: IEmailsService,
    @inject(UserGroupRepository) private userGroups: UserGroupRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(PetitionApprovalRequestRepository)
    private approvalRequests: PetitionApprovalRequestRepository,
  ) {}

  async startApprovalRequestFlowByPetitionId(
    petitionId: number,
    userId: number | null,
    startedBy: string,
    opts?: { forceStartFirstStepManually: boolean },
  ) {
    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petitionId,
    ]);

    if (!composedPetition.approvalFlowConfig) {
      // no approval flow config, do nothing
      return;
    }

    const { signatureConfig } = composedPetition;

    const signatureIsNext = signatureConfig?.isEnabled && !signatureConfig.reviewAfterApproval;

    const approvalLogic = evaluateVisibilityArray(
      composedPetition,
      composedPetition.approvalFlowConfig,
    );

    let firstVisibleStepIndex = -1;
    // create every approval step with the appropriate status based on the manual_start flag and visibility
    const approvalRequestSteps = await this.approvalRequests.createPetitionApprovalRequestSteps(
      zip(composedPetition.approvalFlowConfig, approvalLogic).map(
        ([step, { isVisible }], index) => {
          if (isVisible && firstVisibleStepIndex === -1) {
            firstVisibleStepIndex = index;
          }
          const isFirstStep = index === firstVisibleStepIndex;

          let status: PetitionApprovalRequestStepStatus;
          if (!isVisible) {
            status = "NOT_APPLICABLE";
          } else if (signatureIsNext || (isFirstStep && opts?.forceStartFirstStepManually)) {
            status = "NOT_STARTED";
          } else if (isFirstStep && !step.manual_start && !signatureIsNext) {
            status = "PENDING";
          } else {
            status = "NOT_STARTED";
          }

          return {
            petition_id: petitionId,
            status,
            approval_type: step.type,
            step_name: step.name,
            step_number: index,
            manual_start:
              isFirstStep && opts?.forceStartFirstStepManually ? true : step.manual_start,
          };
        },
      ),
      startedBy,
    );

    // on each step, insert its approvers
    for (const [step, config] of zip(approvalRequestSteps, composedPetition.approvalFlowConfig)) {
      const userIds = await this.extractUserIdsFromApprovalFlowConfig(config);

      await this.approvalRequests.createPetitionApprovalRequestStepApprovers(
        step.id,
        userIds.map((id) => ({ id, sent: step.status === "PENDING" })),
        startedBy,
      );

      if (step.status === "PENDING") {
        // make sure everybody has at least READ access
        const newPermissions = await this.petitions.ensureMinimalPermissions(
          step.petition_id,
          userIds,
          startedBy,
        );

        await this.petitions.createEvent(
          newPermissions.map((p) => ({
            type: "USER_PERMISSION_ADDED",
            petition_id: step.petition_id,
            data: {
              permission_user_id: p.user_id!,
              permission_type: p.type,
              user_id: userId ?? null,
            },
          })),
        );

        await this.emails.sendPetitionApprovalRequestStepPendingEmail(
          step.id,
          null,
          userId ?? null,
        );

        await this.petitions.createEvent({
          type: "PETITION_APPROVAL_REQUEST_STEP_STARTED",
          petition_id: step.petition_id,
          data: {
            petition_approval_request_step_id: step.id,
            petition_comment_id: null,
            user_id: userId ?? null,
          },
        });
      }
    }
  }

  async cancelApprovalRequestFlowByPetitionId(
    petitionId: MaybeArray<number>,
    userId: number,
    opts?: { onlyIfPending?: boolean },
    t?: Knex.Transaction,
  ) {
    const petitionIds = unMaybeArray(petitionId);
    if (petitionIds.length === 0) {
      return [];
    }

    const approvalRequestStepsByPetitionId =
      await this.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId.raw(
        petitionIds,
        t,
      );

    const canceledSteps: (PetitionApprovalRequestStep | null)[] = [];
    for (const petitionSteps of approvalRequestStepsByPetitionId) {
      if (petitionSteps.length === 0) {
        canceledSteps.push(null);
        continue;
      }

      let currentStep = petitionSteps.find((s) => s.status === "PENDING");

      if (!currentStep && !opts?.onlyIfPending) {
        // no pending steps, get latest approved or skipped
        currentStep = findLast(
          petitionSteps,
          (s) => s.status === "APPROVED" || s.status === "SKIPPED",
        );
      }

      if (!currentStep) {
        canceledSteps.push(null);
        continue;
      }

      const canceledStep = await this.approvalRequests.updatePetitionApprovalRequestStep(
        currentStep.id,
        { status: "CANCELED" },
        `User:${userId}`,
        t,
      );

      assert(canceledStep, "Approval request step not found");

      const approvers =
        await this.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId.raw(
          canceledStep.id,
          t,
        );
      const stepApprover = approvers.find((a) => a.user_id === userId);
      if (stepApprover) {
        await this.approvalRequests.updatePetitionApprovalRequestStepApproverTimestamps(
          stepApprover.id,
          { canceled: true },
          `User:${userId}`,
          t,
        );
      } else {
        // insert context user as a new approver, so it can be marked as the approver who canceled this step
        await this.approvalRequests.createPetitionApprovalRequestStepApprovers(
          canceledStep.id,
          [{ id: userId, canceled: true }],
          `User:${userId}`,
          t,
        );
      }

      canceledSteps.push(canceledStep);
    }

    await this.emails.sendPetitionApprovalRequestStepCanceledEmail(
      canceledSteps.filter(isNonNullish).map((s) => s.id),
      userId,
      t,
    );

    await this.petitions.createEvent(
      canceledSteps.filter(isNonNullish).map((s) => ({
        type: "PETITION_APPROVAL_REQUEST_STEP_CANCELED",
        petition_id: s.petition_id,
        data: {
          petition_approval_request_step_id: s.id,
          user_id: userId,
        },
      })),
      t,
    );

    await this.approvalRequests.updatePetitionApprovalRequestStepsAsDeprecated(
      canceledSteps.filter(isNonNullish).map((s) => s.petition_id),
      t,
    );

    return canceledSteps;
  }

  async startApprovalRequestStep(
    stepId: number,
    commentId?: number | null,
    userId?: number | null,
  ) {
    const step = await this.approvalRequests.updatePetitionApprovalRequestStep(
      stepId,
      { status: "PENDING" },
      `User:${userId}`,
    );
    assert(step, "Approval request step not found");
    const approvers =
      await this.approvalRequests.loadPetitionApprovalRequestStepApproversByStepId(stepId);

    if (approvers.length === 0) {
      return step;
    }

    await this.approvalRequests.updatePetitionApprovalRequestStepApproverTimestamps(
      approvers.map((a) => a.id),
      { sent: true },
      `User:${userId}`,
    );

    // make sure everybody has at least READ access
    const newPermissions = await this.petitions.ensureMinimalPermissions(
      step.petition_id,
      approvers.map((a) => a.user_id),
      `User:${userId}`,
    );

    await this.petitions.createEvent(
      newPermissions.map((p) => ({
        type: "USER_PERMISSION_ADDED",
        petition_id: step.petition_id,
        data: {
          permission_user_id: p.user_id!,
          permission_type: p.type,
          user_id: userId ?? null,
        },
      })),
    );

    await this.emails.sendPetitionApprovalRequestStepPendingEmail(step.id, commentId, userId);

    await this.petitions.createEvent({
      type: "PETITION_APPROVAL_REQUEST_STEP_STARTED",
      petition_id: step.petition_id,
      data: {
        petition_approval_request_step_id: step.id,
        petition_comment_id: commentId ?? null,
        user_id: userId ?? null,
      },
    });

    return step;
  }

  async extractUserIdsFromApprovalFlowConfig(config: ApprovalRequestStepConfig) {
    const userGroupsIds = unique(
      config.values.filter((v) => v.type === "UserGroup").map((v) => v.id),
    );
    const petitionFieldIds = unique(
      config.values.filter((v) => v.type === "PetitionField").map((v) => v.id),
    );

    const groupMembers =
      userGroupsIds.length > 0
        ? (await this.userGroups.loadUserGroupMembers(userGroupsIds)).flat()
        : [];

    const replies =
      petitionFieldIds.length > 0
        ? (await this.petitions.loadRepliesForField(petitionFieldIds)).flat()
        : [];

    assert(
      replies.every((r) => isNonNullish(r) && r.type === "USER_ASSIGNMENT"),
      "Expected replies to be user assignments",
    );

    return unique([
      ...config.values.filter((v) => v.type === "User").map((v) => v.id),
      ...groupMembers.map((m) => m.user_id),
      ...replies.map((r) => r.content.value as number),
    ]);
  }
}
