import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function notEmptyArray<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any[] | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (value?.length === 0) {
      throw new ArgValidationError(info, argName, `Value can't be empty.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
