import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function notEmptyObject<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, any>,
) {
  return ((_, args, ctx, info) => {
    const [data, argName] = getArgWithPath(args, prop);
    if (data && Object.values(data).length === 0) {
      throw new ArgValidationError(info, argName, `Required object can't be empty.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
