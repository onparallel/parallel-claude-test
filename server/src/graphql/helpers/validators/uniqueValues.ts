import { core } from "nexus";
import { isNonNullish } from "remeda";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function uniqueValues<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any[] | null | undefined,
  argName: string,
) {
  return ((_, args, ctx, info) => {
    const values = prop(args);
    if (isNonNullish(values) && values.length !== new Set(values).size) {
      throw new ArgValidationError(info, argName, `Arg must have unique values`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
