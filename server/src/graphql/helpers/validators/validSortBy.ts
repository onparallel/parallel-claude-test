import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validSortBy<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, MaybeArray<string> | null | undefined>,
  fields: string[],
) {
  return (async (_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (!value) {
      return;
    }

    const options = fields.flatMap((f) => [`${f}_ASC`, `${f}_DESC`]);
    const invalidField = unMaybeArray(value).find((f) => !options.includes(f));

    if (invalidField) {
      throw new ArgValidationError(
        info,
        argName,
        `Invalid sort by field: ${invalidField}. Expected one of ${options.join(", ")}`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
