import families from "./../../../pdf/utils/fonts.json";

import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function validFontFamily<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (value && !families.find((f) => f.family === value)) {
      throw new ArgValidationError(info, argName, `Unsupported font-family: ${value}.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
