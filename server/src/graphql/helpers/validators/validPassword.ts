import { core } from "@nexus/schema";
import { WhitelistedError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validPassword<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  minLength: number
) {
  return ((_, args, ctx, info) => {
    const password = prop(args);
    if (password && password.length < minLength) {
      throw new WhitelistedError(
        `Password must be at least ${minLength} characters.`,
        "INVALID_PASSWORD_ERROR"
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
