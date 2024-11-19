import { isGlobalId } from "../../../util/globalId";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validGlobalId<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, MaybeArray<string>>,
  validPrefixes: string[],
) {
  return ((_, args, ctx, info) => {
    const [ids, argName] = getArgWithPath(args, prop);
    if (!unMaybeArray(ids).every((id) => validPrefixes.some((prefix) => isGlobalId(id, prefix)))) {
      throw new ArgValidationError(info, argName, "Values are not valid IDs");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
