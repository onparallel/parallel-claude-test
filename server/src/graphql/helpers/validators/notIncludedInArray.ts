import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { toGlobalId } from "../../../util/globalId";

export function userIdNotIncludedInArray<
  TypeName extends string,
  FieldName extends string
>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => any[] | null | undefined,
  argName: string
) {
  return ((_, args, ctx, info) => {
    const userId = toGlobalId("User", ctx.user!.id);
    const array = prop(args);
    if (array?.includes(userId)) {
      throw new ArgValidationError(info, argName, `Invalid value on array.`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
