import { ApolloError } from "apollo-server-core";
import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function emailIsAvailable<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string
) {
  return (async (_, args, ctx) => {
    const email = prop(args);
    const users = await ctx.users.loadUsersByEmail(email.trim().toLowerCase());
    if (users.length > 0) {
      throw new ApolloError("Email is already registered.", "EMAIL_ALREADY_REGISTERED_ERROR");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
