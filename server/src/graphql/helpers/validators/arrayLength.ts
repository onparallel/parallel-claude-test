import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function arrayLength<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, any[] | null | undefined>,
  length: number,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (value && value.length !== length) {
      throw new ArgValidationError(info, argName, `Array must have length ${length}`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
