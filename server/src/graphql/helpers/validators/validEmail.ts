import { core } from "nexus";
import pMap from "p-map";
import { unMaybeArray } from "../../../util/arrays";
import { MaybeArray } from "../../../util/types";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function validEmail<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<string> | null | undefined,
  argName: string,
  onlyRegex = false
) {
  return (async (_, args, ctx, info) => {
    const emails = prop(args);
    if (emails) {
      await pMap(
        unMaybeArray(emails),
        async (email) => {
          if (!(await ctx.emails.validateEmail(email, onlyRegex))) {
            throw new ArgValidationError(info, argName, `${email} is not a valid email.`, {
              email,
              error_code: "INVALID_EMAIL_ERROR",
            });
          }
        },
        { concurrency: 20 }
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
