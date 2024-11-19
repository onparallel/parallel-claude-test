import { fromGlobalIds } from "../../../util/globalId";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { PETITION_FOLDER_REGEX } from "./validPath";

export function validFolderId<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, MaybeArray<string> | null | undefined>,
  allowRoot = false,
) {
  return ((_, args, ctx, info) => {
    const [value, argName] = getArgWithPath(args, prop);
    try {
      const paths = fromGlobalIds(unMaybeArray(value ?? []), "PetitionFolder", true).ids;
      if (paths.some((p) => !PETITION_FOLDER_REGEX.test(p))) {
        throw new Error();
      }
      if (!allowRoot && paths.includes("/")) {
        throw new Error();
      }
    } catch {
      throw new ArgValidationError(
        info,
        argName,
        Array.isArray(value)
          ? `Values are not valid folder IDs`
          : `Value is not a valid folder ID.`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
