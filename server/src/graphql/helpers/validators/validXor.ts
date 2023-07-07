import { core } from "nexus";
import { countBy } from "remeda";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validXor<TypeName extends string, FieldName extends string>(
  props: (args: core.ArgsValue<TypeName, FieldName>) => boolean[],
  argNames: string,
) {
  return ((_, args, ctx, info) => {
    const values = props(args);

    // throw error if more than one value is true
    if (countBy(values, (v) => v) > 1) {
      throw new ArgValidationError(info, argNames, `XOR condition failed`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
