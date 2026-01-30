import { PetitionApprovalRequestStep } from "../../db/__types";

export function getPetitionApprovalRequestStatus(steps: PetitionApprovalRequestStep[]) {
  if (steps.length === 0) {
    return "NO_APPROVAL";
  }

  const filteredSteps = steps.filter((s) => s.status !== "NOT_APPLICABLE");

  if (filteredSteps.some((step) => step.status === "REJECTED")) {
    return "REJECTED";
  }

  if (
    filteredSteps.some((step) => step.status === "PENDING") ||
    (filteredSteps.some((step) => step.status === "APPROVED" || step.status === "SKIPPED") &&
      filteredSteps.some((step) => step.status === "NOT_STARTED"))
  ) {
    return "PENDING";
  }

  if (filteredSteps.every((step) => step.status === "NOT_STARTED")) {
    return "NOT_STARTED";
  }

  if (filteredSteps.every((step) => step.status === "SKIPPED" || step.status === "APPROVED")) {
    return "APPROVED";
  }

  return "NOT_STARTED";
}
