import { core } from "@nexus/schema";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function notEmptyObject<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const data = prop(args);
    if (data && Object.values(data).length === 0) {
      throw new ArgValidationError(info, argName, `Required object can't be empty.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
