import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function maxLength<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
  limit: number,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (value && value!.length > limit) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't be longer than ${limit} characters.`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
