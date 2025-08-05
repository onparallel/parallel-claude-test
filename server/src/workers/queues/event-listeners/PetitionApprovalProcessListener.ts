import { inject, injectable } from "inversify";
import { unique, zip } from "remeda";
import { PetitionCompletedEvent } from "../../../db/events/PetitionEvent";
import { FeatureFlagRepository } from "../../../db/repositories/FeatureFlagRepository";
import { PetitionApprovalRequestRepository } from "../../../db/repositories/PetitionApprovalRequestRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { UserGroupRepository } from "../../../db/repositories/UserGroupRepository";
import { evaluateVisibilityArray } from "../../../util/fieldLogic";
import { EventListener } from "../EventProcessorQueue";

export const PETITION_APPROVAL_PROCESS_LISTENER = Symbol.for("PETITION_APPROVAL_PROCESS_LISTENER");

@injectable()
export class PetitionApprovalProcessListener implements EventListener<"PETITION_COMPLETED"> {
  public readonly types: "PETITION_COMPLETED"[] = ["PETITION_COMPLETED"];

  constructor(
    @inject(PetitionRepository) private readonly petitions: PetitionRepository,
    @inject(FeatureFlagRepository) private readonly featureFlags: FeatureFlagRepository,
    @inject(PetitionApprovalRequestRepository)
    private readonly approvalRequests: PetitionApprovalRequestRepository,
    @inject(UserGroupRepository) private readonly userGroups: UserGroupRepository,
  ) {}

  public async handle(event: PetitionCompletedEvent) {
    const petition = await this.petitions.loadPetition(event.petition_id);

    if (!petition || !petition.approval_flow_config || petition.approval_flow_config.length === 0) {
      return;
    }

    const hasFeatureFlag = await this.featureFlags.orgHasFeatureFlag(
      petition.org_id,
      "PETITION_APPROVAL_FLOW",
    );

    if (!hasFeatureFlag) {
      return;
    }

    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petition.id,
    ]);

    const approvalLogic = evaluateVisibilityArray(composedPetition, petition.approval_flow_config);

    const createdBy = event.data.user_id
      ? `User:${event.data.user_id}`
      : `PetitionAccess:${event.data.petition_access_id!}`;

    // create every approval step. Step statuses will be NOT_STARTED or NOT_APPLICABLE, as completing the petition does not starts the approval flow, only calculates its steps
    let firstVisibleStepIndex = -1;
    const approvalRequestSteps = await this.approvalRequests.createPetitionApprovalRequestSteps(
      zip(petition.approval_flow_config, approvalLogic).map(([step, { isVisible }], index) => {
        if (isVisible && firstVisibleStepIndex === -1) {
          firstVisibleStepIndex = index;
        }
        return {
          petition_id: event.petition_id,
          status: isVisible ? "NOT_STARTED" : "NOT_APPLICABLE",
          approval_type: step.type,
          step_name: step.name,
          step_number: index,
        };
      }),
      createdBy,
    );

    // on each step, insert its approvers
    for (const [step, config] of zip(approvalRequestSteps, petition.approval_flow_config)) {
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
}
