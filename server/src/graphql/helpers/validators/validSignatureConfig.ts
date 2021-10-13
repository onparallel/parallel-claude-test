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
      const { provider, signersInfo, timezone, title, letRecipientsChooseSigners, review } =
        signatureConfig;
      const [hasFeatureFlag, integrations] = await Promise.all([
        ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, "PETITION_SIGNATURE"),
        ctx.integrations.loadEnabledIntegrationsForOrgId(ctx.user!.org_id),
      ]);
      if (!hasFeatureFlag) {
        throw new ArgValidationError(
          info,
          `${argName}`,
          `Petition signature is not available for this user.`
        );
      }
      if (
        !integrations.some(
          (integration) => integration.type === "SIGNATURE" && integration.provider === provider
        )
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

      if (!letRecipientsChooseSigners && signersInfo.length === 0 && !review) {
        throw new ArgValidationError(
          info,
          `${argName}.letRecipientsChooseSigners`,
          "Invalid value with empty list of signers"
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
