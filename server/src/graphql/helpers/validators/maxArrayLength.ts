import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function maxArrayLength<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, any[] | null | undefined>,
  limit: number,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (value && value.length > limit) {
      throw new ArgValidationError(info, argName, `Array can't have more than ${limit} items.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
