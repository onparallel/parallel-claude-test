import { core } from "@nexus/schema";
import { WhitelistedError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function emailDomainIsNotSSO<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string
) {
  return (async (_, args, ctx) => {
    const email = prop(args);
    const [, domain] = email.split("@");
    const ssoIntegration = await ctx.integrations.loadSSOIntegrationByDomain(domain);
    if (ssoIntegration) {
      throw new WhitelistedError(
        "Email domain has a SSO provider enabled.",
        "SSO_DOMAIN_ENABLED_ERROR"
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
