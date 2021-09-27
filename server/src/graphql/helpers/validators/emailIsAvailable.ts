import { core } from "nexus";
import { WhitelistedError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function emailIsAvailable<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string
) {
  return (async (_, args, ctx) => {
    const email = prop(args);
    const user = await ctx.users.loadUserByEmail(email.trim().toLowerCase());
    if (user) {
      throw new WhitelistedError("Email is already registered.", "EMAIL_ALREADY_REGISTERED_ERROR");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
