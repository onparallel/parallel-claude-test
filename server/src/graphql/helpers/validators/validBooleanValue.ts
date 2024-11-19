import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validBooleanValue<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, boolean | null | undefined>,
  value: boolean,
) {
  return ((_, args, ctx, info) => {
    const [curValue, argName] = getArgWithPath(args, prop);
    if (curValue !== value) {
      throw new ArgValidationError(info, argName, `Expected ${value.toString()}`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
