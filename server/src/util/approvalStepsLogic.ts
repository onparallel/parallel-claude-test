import { assert } from "ts-essentials";
import { ApprovalRequestStepConfig } from "../db/repositories/PetitionApprovalRequestRepository";
import { evaluateFieldLogic, FieldLogicPetitionInput } from "./fieldLogic";

export function evaluateApprovalStepsVisibility(
  petition: FieldLogicPetitionInput,
  approvalFlowConfig: ApprovalRequestStepConfig[],
) {
  // at least 1 step is required for this to work
  assert(approvalFlowConfig.length > 0, "At least 1 step is required");

  return evaluateFieldLogic({
    ...petition,
    // add 1 mock field for each step in the approval flow, to be able to evaluate their visibilities based on previous fields
    fields: petition.fields.concat(
      approvalFlowConfig.map((step) => ({
        id: 0, // ID does not matter, as this "fields" will never be referenced
        type: "HEADING" as const,
        visibility: step.visibility ?? null,
        options: {},
        replies: [],
        math: null,
      })),
    ),
  }).slice(
    -approvalFlowConfig.length, // only return the last N items, which are the logic results for the approval steps
  );
}
