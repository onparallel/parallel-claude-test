import { core } from "@nexus/schema";
import { isDefined } from "remeda";
import { fromGlobalIds } from "../../../util/globalId";
import { isValidTimezone } from "../../../util/validators";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validSignatureConfig<TypeName extends string, FieldName extends string>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => core.GetGen2<"inputTypes", "SignatureConfigInput"> | null | undefined,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const signatureConfig = prop(args);
    if (signatureConfig) {
      const { provider, contactIds, timezone, title } = signatureConfig;
      const [hasFeatureFlag, contacts, integrations] = await Promise.all([
        ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, "PETITION_SIGNATURE"),
        ctx.contacts.loadContact(fromGlobalIds(contactIds, "Contact").ids),
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
      if (contacts.some((c) => c === null || c.org_id !== ctx.user!.org_id)) {
        throw new ArgValidationError(info, `${argName}.contactIds`, `Invalid list of contacts.`);
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
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
