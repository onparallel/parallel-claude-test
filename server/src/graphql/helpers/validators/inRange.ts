import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { isDefined } from "../../../util/remedaExtensions";

export function inRange<TypeName extends string, FieldName extends string>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => number | null | undefined,
  argName: string,
  lowerLimit = -Infinity,
  upperLimit = Infinity
) {
  return ((_, args, ctx, info) => {
    const value = prop(args);
    if (isDefined(value) && (value! < lowerLimit || value! > upperLimit)) {
      throw new ArgValidationError(
        info,
        argName,
        `Value must be in the range [${lowerLimit}, ${upperLimit}]`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
