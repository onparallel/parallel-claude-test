import { isNonNullish } from "remeda";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function inRange<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, number | null | undefined>,
  lowerLimit = -Infinity,
  upperLimit = Infinity,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (isNonNullish(value) && (value < lowerLimit || value > upperLimit)) {
      throw new ArgValidationError(
        info,
        argName,
        `Value must be in the range [${lowerLimit}, ${upperLimit}]`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
