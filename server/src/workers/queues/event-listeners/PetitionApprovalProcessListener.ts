import { inject, injectable } from "inversify";
import {
  PetitionApprovalRequestStepFinishedEvent,
  PetitionApprovalRequestStepSkippedEvent,
  PetitionCompletedEvent,
  PetitionRecoveredFromDeletionEvent,
  SignatureCompletedEvent,
} from "../../../db/events/PetitionEvent";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionApprovalRequestRepository } from "../../../db/repositories/PetitionApprovalRequestRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { APPROVALS_SERVICE, IApprovalsService } from "../../../services/ApprovalsService";
import { EventListener } from "../EventProcessorQueue";

export const PETITION_APPROVAL_PROCESS_LISTENER = Symbol.for("PETITION_APPROVAL_PROCESS_LISTENER");

@injectable()
export class PetitionApprovalProcessListener
  implements
    EventListener<
      | "PETITION_COMPLETED"
      | "PETITION_RECOVERED_FROM_DELETION"
      | "SIGNATURE_COMPLETED"
      | "PETITION_APPROVAL_REQUEST_STEP_FINISHED"
      | "PETITION_APPROVAL_REQUEST_STEP_SKIPPED"
    >
{
  public readonly types: (
    | "PETITION_COMPLETED"
    | "PETITION_RECOVERED_FROM_DELETION"
    | "SIGNATURE_COMPLETED"
    | "PETITION_APPROVAL_REQUEST_STEP_FINISHED"
    | "PETITION_APPROVAL_REQUEST_STEP_SKIPPED"
  )[] = [
    "PETITION_COMPLETED",
    "PETITION_RECOVERED_FROM_DELETION",
    "SIGNATURE_COMPLETED",
    "PETITION_APPROVAL_REQUEST_STEP_FINISHED",
    "PETITION_APPROVAL_REQUEST_STEP_SKIPPED",
  ];

  constructor(
    @inject(PetitionApprovalRequestRepository)
    private readonly approvalRequests: PetitionApprovalRequestRepository,
    @inject(PetitionRepository) private readonly petitions: PetitionRepository,
    @inject(FeatureFlagRepository) private readonly featureFlags: FeatureFlagRepository,
    @inject(APPROVALS_SERVICE)
    private readonly approvals: IApprovalsService,
  ) {}

  public async handle(
    event:
      | PetitionCompletedEvent
      | PetitionRecoveredFromDeletionEvent
      | SignatureCompletedEvent
      | PetitionApprovalRequestStepFinishedEvent
      | PetitionApprovalRequestStepSkippedEvent,
  ) {
    const petition = await this.petitions.loadPetition(event.petition_id);

    if (
      !petition ||
      !petition.approval_flow_config ||
      petition.approval_flow_config.length === 0 ||
      petition.deletion_scheduled_at !== null
    ) {
      return;
    }

    const hasFeatureFlag = await this.featureFlags.orgHasFeatureFlag(
      petition.org_id,
      "PETITION_APPROVAL_FLOW",
    );

    if (!hasFeatureFlag) {
      return;
    }
    const currentSteps =
      await this.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId(petition.id);

    if (event.type === "PETITION_COMPLETED" || event.type === "PETITION_RECOVERED_FROM_DELETION") {
      if (currentSteps.length === 0) {
        await this.approvals.startApprovalRequestFlowByPetitionId(
          petition.id,
          null,
          `PetitionEvent:${event.id}`,
          // do not start automatically if the petition is recovered from deletion
          { forceStartFirstStepManually: event.type === "PETITION_RECOVERED_FROM_DELETION" },
        );
      }

      return;
    }

    if (
      event.type === "SIGNATURE_COMPLETED" ||
      (event.type === "PETITION_APPROVAL_REQUEST_STEP_FINISHED" && event.data.is_approved) ||
      event.type === "PETITION_APPROVAL_REQUEST_STEP_SKIPPED"
    ) {
      const nextStep = currentSteps.find((s) => s.status === "NOT_STARTED");
      if (nextStep?.manual_start === false) {
        await this.approvals.startApprovalRequestStep(nextStep.id);
      }

      return;
    }
  }
}
