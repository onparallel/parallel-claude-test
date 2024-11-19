import { isNonNullish } from "remeda";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function notEmptyArray<TypeName extends string, FieldName extends string>(
  arrayArg: ArgWithPath<TypeName, FieldName, any[] | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, arrayArg);
    if (isNonNullish(value) && value.length === 0) {
      throw new ArgValidationError(info, argName, `Value can't be empty.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
