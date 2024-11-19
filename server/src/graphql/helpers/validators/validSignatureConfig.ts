import { core } from "nexus";
import { isNonNullish, isNullish } from "remeda";
import { isValidTimezone } from "../../../util/time";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { EMAIL_REGEX } from "./validEmail";

export function validSignatureConfig<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    core.GetGen2<"inputTypes", "SignatureConfigInput"> | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [signatureConfig, argName] = getArgWithPath(args, prop);
    if (signatureConfig) {
      const { orgIntegrationId, signersInfo, timezone, instructions, review, useCustomDocument } =
        signatureConfig;

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
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
