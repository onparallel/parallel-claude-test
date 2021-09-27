import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function maxLength<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
  limit: number
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (value && value!.length > limit) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't be longer than ${limit} characters.`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
