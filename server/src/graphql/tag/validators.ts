import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validateHexColor<TypeName extends string, FieldName extends string>(
  colorArg: ArgWithPath<TypeName, FieldName, string | undefined | null>,
) {
  return ((_, args, ctx, info) => {
    const [color, argName] = getArgWithPath(args, colorArg);
    if (color && !color.match(/^#[a-fA-F0-9]{6}$/)) {
      throw new ArgValidationError(info, argName, `Argument must represent a HEX color value.`, {
        code: "INVALID_HEX_VALUE_ERROR",
      });
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
