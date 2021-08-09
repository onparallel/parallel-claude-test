import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function userIdNotIncludedInArray<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any[] | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const array = prop(args);
    if (array?.includes(ctx.user!.id)) {
      throw new ArgValidationError(info, argName, `Invalid value on array.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
