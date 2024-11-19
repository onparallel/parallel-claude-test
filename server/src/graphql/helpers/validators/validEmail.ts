import pMap from "p-map";
import { isNonNullish } from "remeda";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function validEmail<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, MaybeArray<string> | null | undefined>,
  onlyRegex = false,
) {
  return (async (_, args, ctx, info) => {
    const [emails, argName] = getArgWithPath(args, prop);
    if (emails) {
      await pMap(
        unMaybeArray(emails).filter(isNonNullish),
        async (email) => {
          if (!EMAIL_REGEX.test(email)) {
            throw new ArgValidationError(info, argName, `'${email}' is not a valid email.`, {
              email,
              error_code: "INVALID_EMAIL_ERROR",
            });
          }
          if (!onlyRegex && !(await ctx.emails.validateEmail(email))) {
            throw new ArgValidationError(info, argName, `'${email}' is not a valid email.`, {
              email,
              error_code: "INVALID_MX_EMAIL_ERROR",
            });
          }
        },
        { concurrency: 20 },
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
