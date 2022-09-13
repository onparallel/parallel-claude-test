import { core } from "nexus";
import { validateRegex } from "./validateRegex";

export const PETITION_FOLDER_REGEX = /^\/([^/]+\/)*$/;

export function validPath<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string
) {
  return validateRegex(prop, argName, PETITION_FOLDER_REGEX);
}
