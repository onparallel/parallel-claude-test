import { isNonNullish } from "remeda";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function uniqueValues<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, any[] | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [values, argName] = getArgWithPath(args, prop);
    if (isNonNullish(values) && values.length !== new Set(values).size) {
      throw new ArgValidationError(info, argName, `Arg must have unique values`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
