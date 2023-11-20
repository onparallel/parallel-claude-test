import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function notEmptyString<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
) {
  return ((_, args, ctx, info) => {
    const value = prop(args)?.trim();
    if (!value) {
      throw new ArgValidationError(info, argName, `Value can't be empty.`, {
        error_code: "VALUE_IS_EMPTY_ERROR",
        error_message: `${argName} can't be empty.`,
      });
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
