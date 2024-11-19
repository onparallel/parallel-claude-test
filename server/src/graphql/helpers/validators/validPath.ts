import { ArgWithPath } from "../authorize";
import { validateRegex } from "./validateRegex";

export const PETITION_FOLDER_REGEX = /^\/([^/]+\/)*$/;

export function validPath<TypeName extends string, FieldName extends string>(
  stringArg: ArgWithPath<TypeName, FieldName, string | null | undefined>,
) {
  return validateRegex(stringArg, PETITION_FOLDER_REGEX);
}
