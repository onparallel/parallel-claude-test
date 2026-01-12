import { isGlobalId } from "../../../util/globalId";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validSortBy<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, MaybeArray<string> | null | undefined>,
  fields: string[],
  opts?: { allowDynamicFields: string },
) {
  return (async (_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (!value) {
      return;
    }

    const values = unMaybeArray(value);

    const options = fields.map((f) => `${f}_(ASC|DESC)`);

    if (opts?.allowDynamicFields) {
      options.push(`${opts.allowDynamicFields}[a-zA-Z0-9]+_(ASC|DESC)`);
    }
    const invalidField = values.find((f) => !f.match(new RegExp(options.join("|"))));

    if (invalidField) {
      throw new ArgValidationError(info, argName, `Invalid sort by field: ${invalidField}`);
    }

    if (opts?.allowDynamicFields) {
      const dynamicValues = values.filter((f) => f.match(new RegExp(opts.allowDynamicFields)));

      const invalidDynamicField = dynamicValues.find(
        (v) => !isGlobalId(v.split(opts.allowDynamicFields)[1].split("_")[0]),
      );
      if (invalidDynamicField) {
        throw new ArgValidationError(
          info,
          argName,
          `Invalid sort by field: ${invalidDynamicField}`,
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
