import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { isDefined } from "remeda";

export function validateRegex<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
  regex: RegExp,
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (isDefined(value) && !value.match(regex)) {
      throw new ArgValidationError(info, argName, `Value does not match ${regex}.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
