import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function minLength<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
  min: number
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (value && value!.length < min) {
      throw new ArgValidationError(info, argName, `Value must be at least ${min} characters.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
