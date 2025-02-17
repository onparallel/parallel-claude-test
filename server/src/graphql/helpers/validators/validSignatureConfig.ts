import { isNonNullish, isNullish } from "remeda";
import { isValidTimezone } from "../../../util/time";
import { NexusGenInputs } from "../../__types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { EMAIL_REGEX } from "./validEmail";

export function validSignatureConfig<TypeName extends string, FieldName extends string>(
  petitionIdProp: ArgWithPath<TypeName, FieldName, number>,
  signatureConfigProp: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["SignatureConfigInput"] | null | undefined
  >,
  approvalFlowConfigProp: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["ApprovalFlowConfigInput"][] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [petitionId] = getArgWithPath(args, petitionIdProp);
    const [approvalFlowConfigInput] = getArgWithPath(args, approvalFlowConfigProp);

    const [signatureConfigInput, argName] = getArgWithPath(args, signatureConfigProp);
    if (signatureConfigInput) {
      const {
        orgIntegrationId,
        signersInfo,
        timezone,
        instructions,
        review,
        useCustomDocument,
        reviewAfterApproval,
      } = signatureConfigInput;

      const integration = await ctx.integrations.loadIntegration(orgIntegrationId);
      if (
        isNullish(integration) ||
        integration.type !== "SIGNATURE" ||
        !integration.is_enabled ||
        integration.org_id !== ctx.user!.org_id
      ) {
        throw new ArgValidationError(info, `${argName}.provider`, `Invalid signature provider.`);
      }

      if (signersInfo.some((signer) => !EMAIL_REGEX.test(signer.email))) {
        throw new ArgValidationError(info, `${argName}.signersInfo`, `Invalid list of emails.`);
      }
      if (!isValidTimezone(timezone)) {
        throw new ArgValidationError(
          info,
          `${argName}.timezone`,
          `Value must be a valid timezone.`,
        );
      }

      if (isNonNullish(instructions) && instructions.length > 300) {
        throw new ArgValidationError(
          info,
          `${argName}.instructions`,
          `Instructions must be equal or less than 300 characters.`,
        );
      }

      if (useCustomDocument && !review) {
        throw new ArgValidationError(
          info,
          `${argName}.review`,
          `Review is required when using a custom document.`,
        );
      }

      if (isNonNullish(reviewAfterApproval) && !review) {
        throw new ArgValidationError(
          info,
          `${argName}.reviewAfterApproval`,
          `review must be enabled to use reviewAfterApproval.`,
        );
      }

      if (isNonNullish(reviewAfterApproval)) {
        // prioritize the input value over the petition value
        if (!approvalFlowConfigInput) {
          const petition = await ctx.petitions.loadPetition(petitionId);
          const approvalConfig = petition?.approval_flow_config;
          if (!approvalConfig) {
            throw new ArgValidationError(
              info,
              `${argName}.reviewAfterApproval`,
              `petition must have a configured approval request.`,
            );
          }
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
