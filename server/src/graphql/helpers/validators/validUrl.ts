import { URL } from "url";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validUrl<TypeName extends string, FieldName extends string>(
  stringArg: ArgWithPath<TypeName, FieldName, string | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, stringArg);
    if (value) {
      try {
        new URL(value);
      } catch {
        throw new ArgValidationError(info, argName, "Invalid URL");
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
