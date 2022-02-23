import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { MaybeArray } from "../../../util/types";
import { unMaybeArray } from "../../../util/arrays";
import { resolveMx } from "dns/promises";

export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

async function hasInvalidEmail(emails: string[]) {
  try {
    for (const email of emails) {
      if (!EMAIL_REGEX.test(email)) return true;
      await resolveMx(email.split("@")[1]);
    }
    return false;
  } catch {
    return true;
  }
}

export function validEmail<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<string> | null | undefined,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const emails = prop(args);
    if (emails) {
      if (await hasInvalidEmail(unMaybeArray(emails))) {
        throw new ArgValidationError(info, argName, `Value is not a valid email.`);
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
