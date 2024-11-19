import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validPassword<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
) {
  return ((_, args, ctx, info) => {
    const [password, argName] = getArgWithPath(args, prop);
    if (!password || !password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)) {
      throw new ArgValidationError(
        info,
        argName,
        "Provided password cannot be used for security reasons.",
        { code: "INVALID_PASSWORD_ERROR" },
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
