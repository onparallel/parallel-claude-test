import { ArgWithPath, getArgWithPath } from "../authorize";
import { ApolloError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function emailIsAvailable<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string>,
) {
  return (async (_, args, ctx, info) => {
    const [email] = getArgWithPath(args, prop);
    const users = await ctx.users.loadUsersByEmail(email.trim().toLowerCase());
    if (users.length > 0) {
      throw new ApolloError("Email is already registered", "EMAIL_ALREADY_REGISTERED_ERROR");
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
