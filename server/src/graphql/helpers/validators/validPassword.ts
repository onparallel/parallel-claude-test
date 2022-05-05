import { ApolloError } from "apollo-server-core";
import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validPassword<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined
) {
  return ((_, args, ctx, info) => {
    const password = prop(args);
    if (!password || !password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)) {
      throw new ApolloError(
        "Provided password cannot be used for security reasons.",
        "INVALID_PASSWORD_ERROR"
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
