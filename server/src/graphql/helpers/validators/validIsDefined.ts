import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function validIsDefined<
  TypeName extends string,
  FieldName extends string
>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (value === null || value === undefined) {
      throw new ArgValidationError(
        info,
        argName,
        `Expected ${argName} to be defined`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
