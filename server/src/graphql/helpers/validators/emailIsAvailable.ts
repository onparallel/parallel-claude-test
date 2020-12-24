import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function emailIsAvailable<
  TypeName extends string,
  FieldName extends string
>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => string | null | undefined,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const email = prop(args);
    const user = await ctx.users.loadUserByEmail(email!);
    if (user) {
      throw new ArgValidationError(
        info,
        argName,
        `Email is not available for register.`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
