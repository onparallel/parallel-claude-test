import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { isDefined } from "../../../util/remedaExtensions";

export function validIsDefined<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (!isDefined(value)) {
      throw new ArgValidationError(info, argName, `Expected ${argName} to be defined`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
