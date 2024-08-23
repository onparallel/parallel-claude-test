import { core } from "nexus";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validBooleanValue<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => boolean | null | undefined,
  argName: string,
  value: boolean,
) {
  return ((_, args, ctx, info) => {
    const curValue = prop(args);
    if (curValue !== value) {
      throw new ArgValidationError(info, argName, `Expected ${value.toString()}`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
