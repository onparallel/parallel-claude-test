import fonts from "../../../util/webSafeFonts.json";

import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validWebSafeFontFamily<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    if (value && !fonts.find((f) => f[1] === value)) {
      throw new ArgValidationError(info, argName, `Unsupported font-family: ${value}.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
