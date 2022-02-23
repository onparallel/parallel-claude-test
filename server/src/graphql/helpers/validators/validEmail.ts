import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { MaybeArray } from "../../../util/types";
import { unMaybeArray } from "../../../util/arrays";
import { resolveMx } from "dns/promises";
import pMap from "p-map";

export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function validEmail<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<string> | null | undefined,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const emails = prop(args);
    if (emails) {
      await pMap(
        unMaybeArray(emails),
        async (email) => {
          if (EMAIL_REGEX.test(email)) {
            try {
              await resolveMx(email.split("@")[1]);
              return true;
            } catch {}
          }
          throw new ArgValidationError(info, argName, `${email} is not a valid email.`);
        },
        { concurrency: 5 }
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
