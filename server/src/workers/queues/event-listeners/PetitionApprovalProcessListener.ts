import { inject, injectable } from "inversify";
import {
  PetitionCompletedEvent,
  PetitionRecoveredFromDeletionEvent,
} from "../../../db/events/PetitionEvent";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { APPROVALS_SERVICE, IApprovalsService } from "../../../services/ApprovalsService";
import { EventListener } from "../EventProcessorQueue";

export const PETITION_APPROVAL_PROCESS_LISTENER = Symbol.for("PETITION_APPROVAL_PROCESS_LISTENER");

@injectable()
export class PetitionApprovalProcessListener
  implements EventListener<"PETITION_COMPLETED" | "PETITION_RECOVERED_FROM_DELETION">
{
  public readonly types: ("PETITION_COMPLETED" | "PETITION_RECOVERED_FROM_DELETION")[] = [
    "PETITION_COMPLETED",
    "PETITION_RECOVERED_FROM_DELETION",
  ];

  constructor(
    @inject(PetitionRepository) private readonly petitions: PetitionRepository,
    @inject(FeatureFlagRepository) private readonly featureFlags: FeatureFlagRepository,
    @inject(APPROVALS_SERVICE)
    private readonly approvals: IApprovalsService,
  ) {}

  public async handle(event: PetitionCompletedEvent | PetitionRecoveredFromDeletionEvent) {
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

    const createdBy =
      event.data.user_id || event.type === "PETITION_RECOVERED_FROM_DELETION"
        ? `User:${event.data.user_id}`
        : `PetitionAccess:${event.data.petition_access_id!}`;

    await this.approvals.startApprovalRequestFlowByPetitionId(petition.id, createdBy);
  }
}
