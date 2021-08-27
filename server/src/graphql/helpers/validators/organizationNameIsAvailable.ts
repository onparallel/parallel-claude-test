import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function organizationNameIsAvailable<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const identifier = prop(args).trim().toLowerCase().replace(/ /g, "-");

    const organization = await ctx.organizations.loadOrgByIdentifier(identifier);
    if (organization) {
      throw new ArgValidationError(info, argName, "This organization name is already registered.");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
