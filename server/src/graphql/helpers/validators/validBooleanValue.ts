import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function validBooleanValue<
  TypeName extends string,
  FieldName extends string
>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => boolean | null | undefined,
  argName: string,
  value: boolean
) {
  return ((_, args, ctx, info) => {
    const curValue = prop(args);
    if (curValue !== value) {
      throw new ArgValidationError(
        info,
        argName,
        `Expected ${value.toString()}`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
