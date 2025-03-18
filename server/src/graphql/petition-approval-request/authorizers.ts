import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { PetitionApprovalRequestStepStatus } from "../../db/__types";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, getArg } from "../helpers/authorize";
import { ForbiddenError } from "../helpers/errors";

export function approvalRequestStepIsNextWithStatus<
  TypeName extends string,
  FieldName extends string,
>(
  petitionIdArg: Arg<TypeName, FieldName, number>,
  approvalRequestStepIdArg: Arg<TypeName, FieldName, number>,
  status: MaybeArray<PetitionApprovalRequestStepStatus>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const approvalRequestStepId = getArg(args, approvalRequestStepIdArg);
    const statuses = unMaybeArray(status);

    const petition = await ctx.petitions.loadPetition(petitionId);
    if (petition?.signature_config?.isEnabled && !petition.signature_config.reviewAfterApproval) {
      throw new ForbiddenError("A signature process is required before starting approval request");
    }

    const currentApprovalRequestSteps =
      await ctx.approvalRequests.loadCurrentPetitionApprovalRequestStepsByPetitionId(petitionId);
    // make sure there is no previous unfinished step
    for (const step of currentApprovalRequestSteps) {
      if (
        step.id !== approvalRequestStepId &&
        ["NOT_STARTED", "PENDING", "CANCELED", "REJECTED"].includes(step.status)
      ) {
        throw new ForbiddenError(`There is a previous step in ${step.status} status`);
      }

      if (step.id === approvalRequestStepId && !statuses.includes(step.status)) {
        throw new ForbiddenError(`The step must have ${statuses.join(" or ")} status`);
      }

      if (step.id === approvalRequestStepId) {
        // when the step is the one we are looking for, we can break the loop
        return true;
      }
    }

    return false;
  };
}
