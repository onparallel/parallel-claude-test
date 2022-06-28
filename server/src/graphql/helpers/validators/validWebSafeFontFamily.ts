import fonts from "../../../util/webSafeFonts.json";

import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function validWebSafeFontFamily<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (value && !fonts.find((f) => f[1] === value)) {
      throw new ArgValidationError(info, argName, `Unsupported font-family: ${value}.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
