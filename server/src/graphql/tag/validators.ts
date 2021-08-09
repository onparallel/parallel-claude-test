import { core } from "@nexus/schema";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validateHexColor<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const color = prop(args);
    if (color && !color.match(/^#[a-fA-F0-9]{6}$/)) {
      throw new ArgValidationError(info, argName, `Argument must represent a HEX color value.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
