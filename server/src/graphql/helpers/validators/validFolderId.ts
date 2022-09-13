import { core } from "nexus";
import { unMaybeArray } from "../../../util/arrays";
import { fromGlobalIds } from "../../../util/globalId";
import { MaybeArray } from "../../../util/types";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export const PETITION_FOLDER_REGEX = /^\/([^/]+\/)*$/;

export function validFolderId<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<string> | null | undefined,
  argName: string,
  allowRoot = false
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
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
        Array.isArray(value) ? `Values are not valid folder IDs` : `Value is not a valid folder ID.`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
