import { isNonNullish } from "remeda";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function notEmptyString<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    const valueStr = value?.trim();

    if (isNonNullish(valueStr) && valueStr.length === 0) {
      throw new ArgValidationError(info, argName, `Value can't be empty.`, {
        error_code: "VALUE_IS_EMPTY_ERROR",
        error_message: `${argName} can't be empty.`,
      });
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
