import { core } from "nexus";
import { URL } from "url";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validUrl<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const url = prop(args);
    if (url) {
      try {
        new URL(url);
      } catch (e: any) {
        throw new ArgValidationError(info, argName, e.message);
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
