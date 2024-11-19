import { isNullish } from "remeda";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validIsNonNullish<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, any | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (isNullish(value)) {
      throw new ArgValidationError(info, argName, `Expected ${argName} to be defined`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validIsNotUndefined<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, any | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (value === undefined) {
      throw new ArgValidationError(info, argName, `Expected ${argName} not to be undefined`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
