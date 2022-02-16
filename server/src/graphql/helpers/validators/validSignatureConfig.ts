import { core } from "nexus";
import { isDefined } from "remeda";
import { isValidTimezone } from "../../../util/validators";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { EMAIL_REGEX } from "./validEmail";

export function validSignatureConfig<TypeName extends string, FieldName extends string>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => core.GetGen2<"inputTypes", "SignatureConfigInput"> | null | undefined,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const signatureConfig = prop(args);
    if (signatureConfig) {
      const { orgIntegrationId, signersInfo, timezone, title, allowAdditionalSigners, review } =
        signatureConfig;

      const integration = await ctx.integrations.loadIntegration(orgIntegrationId);
      if (
        !isDefined(integration) ||
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
          `Value must be a valid timezone.`
        );
      }

      if (!isDefined(title)) {
        throw new ArgValidationError(info, `${argName}.title`, "Value must be defined");
      }

      if (!allowAdditionalSigners && signersInfo.length === 0 && !review) {
        throw new ArgValidationError(
          info,
          `${argName}.allowAdditionalSigners`,
          "Invalid value with empty list of signers"
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
