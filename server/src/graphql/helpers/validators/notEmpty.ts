import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function notEmpty<TypeName extends string, FieldName extends string>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => string | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (!value) {
      throw new ArgValidationError(info, argName, `Value can't be empty.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
