import { isNonNullish } from "remeda";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { NexusGenInputs } from "../../__types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validSortByInput<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    MaybeArray<NexusGenInputs["SortByInput"]> | null | undefined
  >,
  fields: string[],
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (isNonNullish(value)) {
      const sortFields = unMaybeArray(value).map((v) => v.field);

      const invalidField = sortFields.find((f) => !fields.includes(f));
      if (invalidField) {
        throw new ArgValidationError(info, argName, `Invalid sort by field: ${invalidField}`);
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
