import { core } from "nexus";
import { isDefined } from "remeda";
import { ArgValidationError } from "../errors";
import { LocalizableUserText } from "../scalars/LocalizableUserText";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validLocalizableUserText<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => LocalizableUserText | null | undefined,
  argName: string,
  { maxLength }: { maxLength: number }
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (isDefined(value)) {
      const keys = Object.keys(value) as (keyof LocalizableUserText)[];
      if (keys.length === 0) {
        throw new ArgValidationError(
          info,
          argName,
          `Invalid LocalizableUserText, at least one translation must be provided.`
        );
      }
      let allEmpty = true;
      for (const key of keys) {
        if (value[key]!.trim().length > 0) {
          allEmpty = false;
        }
        if (value[key]!.length > maxLength) {
          throw new ArgValidationError(
            info,
            argName,
            `Invalid LocalizableUserText, value can't be longer than ${maxLength} characters.`
          );
        }
      }
      if (allEmpty) {
        throw new ArgValidationError(
          info,
          argName,
          `Invalid LocalizableUserText, at least one translation must be provided.`
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
