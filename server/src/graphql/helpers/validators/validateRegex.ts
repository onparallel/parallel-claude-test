import { core } from "nexus";
import { isNonNullish } from "remeda";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validateRegex<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
  regex: RegExp,
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (isNonNullish(value) && !value.match(regex)) {
      throw new ArgValidationError(info, argName, `Value does not match ${regex}.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
