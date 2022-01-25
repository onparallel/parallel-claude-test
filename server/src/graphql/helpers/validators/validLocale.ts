import { core } from "nexus";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

const LOCALES = ["en", "es"];

export function validLocale<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const locale = prop(args);
    if (locale && !LOCALES.includes(locale)) {
      throw new ArgValidationError(info, argName, `locale should be one if ${LOCALES.join(", ")}`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
