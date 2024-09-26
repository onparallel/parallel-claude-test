import { core } from "nexus";
import { isGlobalId } from "../../../util/globalId";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validGlobalId<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<string>,
  validPrefixes: string[],
  argName: string,
) {
  return ((_, args, ctx, info) => {
    const ids = unMaybeArray(prop(args));
    if (!ids.every((id) => validPrefixes.some((prefix) => isGlobalId(id, prefix)))) {
      throw new ArgValidationError(info, argName, "Values are not valid IDs");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
