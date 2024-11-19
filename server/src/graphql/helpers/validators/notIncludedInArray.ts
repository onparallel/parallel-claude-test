import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function userIdNotIncludedInArray<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, number[]>,
) {
  return ((_, args, ctx, info) => {
    const [array, argName] = getArgWithPath(args, prop);
    if (array.includes(ctx.user!.id)) {
      throw new ArgValidationError(info, argName, `Invalid value on array.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
