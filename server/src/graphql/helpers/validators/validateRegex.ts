import { isNonNullish } from "remeda";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validateRegex<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
  regex: RegExp,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (isNonNullish(value) && !value.match(regex)) {
      throw new ArgValidationError(info, argName, `Value does not match ${regex}.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
