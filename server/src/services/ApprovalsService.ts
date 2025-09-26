import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { findLast, isNonNullish, unique, zip } from "remeda";
import { assert } from "ts-essentials";
import { PetitionApprovalRequestStep } from "../db/__types";
import { PetitionApprovalRequestRepository } from "../db/repositories/PetitionApprovalRequestRepository";
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
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<void>;
  cancelApprovalRequestFlowByPetitionId(
    petitionId: MaybeArray<number>,
    userId: number,
    opts?: { onlyIfPending?: boolean },
    t?: Knex.Transaction,
  ): Promise<(PetitionApprovalRequestStep | null)[]>;
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
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petitionId,
    ]);

    if (!composedPetition.approvalFlowConfig) {
      // no approval flow config, do nothing
      return;
    }

    const approvalLogic = evaluateVisibilityArray(
      composedPetition,
      composedPetition.approvalFlowConfig,
    );

    // create every approval step. Step statuses will be NOT_STARTED or NOT_APPLICABLE, as completing the petition does not starts the approval flow, only calculates its steps
    let firstVisibleStepIndex = -1;
    const approvalRequestSteps = await this.approvalRequests.createPetitionApprovalRequestSteps(
      zip(composedPetition.approvalFlowConfig, approvalLogic).map(
        ([step, { isVisible }], index) => {
          if (isVisible && firstVisibleStepIndex === -1) {
            firstVisibleStepIndex = index;
          }
          return {
            petition_id: petitionId,
            status: isVisible ? "NOT_STARTED" : "NOT_APPLICABLE",
            approval_type: step.type,
            step_name: step.name,
            step_number: index,
          };
        },
      ),
      createdBy,
    );

    // on each step, insert its approvers
    for (const [step, config] of zip(approvalRequestSteps, composedPetition.approvalFlowConfig)) {
      const userGroupsIds = config.values.filter((v) => v.type === "UserGroup").map((v) => v.id);
      const groupMembers = (await this.userGroups.loadUserGroupMembers(userGroupsIds)).flat();
      const userIds = unique([
        ...config.values.filter((v) => v.type === "User").map((v) => v.id),
        ...groupMembers.map((m) => m.user_id),
      ]);

      await this.approvalRequests.createPetitionApprovalRequestStepApprovers(
        step.id,
        userIds.map((id) => ({ id })),
        createdBy,
      );
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
}
