import { core } from "nexus";
import { isDefined } from "remeda";
import { fromGlobalId } from "../../../util/globalId";
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
      const { orgIntegrationId, signersInfo, timezone, title, letRecipientsChooseSigners, review } =
        signatureConfig;

      const { id: integrationId, type } = fromGlobalId(orgIntegrationId);
      if (type !== "OrgIntegration") {
        throw new ArgValidationError(
          info,
          argName,
          `Invalid orgIntegrationId: ${orgIntegrationId}`
        );
      }
      const [hasFeatureFlag, integration] = await Promise.all([
        ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, "PETITION_SIGNATURE"),
        ctx.integrations.loadIntegration(integrationId),
      ]);
      if (!hasFeatureFlag) {
        throw new ArgValidationError(
          info,
          `${argName}`,
          `Petition signature is not available for this user.`
        );
      }
      if (
        integration?.type !== "SIGNATURE" ||
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
