import { ArgWithPath, getArgWithPath } from "../authorize";
import { ApolloError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function emailDomainIsNotSSO<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string>,
) {
  return (async (_, args, ctx, info) => {
    const [email] = getArgWithPath(args, prop);
    const [, domain] = email.split("@");
    const ssoIntegration = await ctx.integrations.loadSSOIntegrationByDomain(domain);

    if (ssoIntegration) {
      throw new ApolloError("Email domain has a SSO provider enabled.", "SSO_DOMAIN_ENABLED_ERROR");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
