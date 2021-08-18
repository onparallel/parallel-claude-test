import { ArgsValue } from "@nexus/schema/dist/core";
import { GraphQLResolveInfo } from "graphql";
import { decode } from "jsonwebtoken";
import { isDefined } from "remeda";
import { Petition, PetitionAccess, PetitionAccessStatus, PetitionStatus } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { Maybe } from "../../util/types";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validatePetitionStatus(
  petition: Maybe<Petition>,
  status: PetitionStatus,
  info: GraphQLResolveInfo
) {
  if (!petition || petition.status !== status) {
    throw new ArgValidationError(info, "petitionId", `Petition must have status "${status}".`);
  }
}

export function validateAccessesStatus(
  accesses: Maybe<PetitionAccess>[],
  status: PetitionAccessStatus,
  info: GraphQLResolveInfo
) {
  for (const access of accesses) {
    if (!access || access.status !== status) {
      throw new ArgValidationError(
        info,
        "accessId",
        `Petition access must have status "${status}".`
      );
    }
  }
}

export function validateAccessesRemindersLeft(
  accesses: Maybe<PetitionAccess>[],
  info: GraphQLResolveInfo
) {
  for (const access of accesses) {
    if (access && access.reminders_left === 0) {
      throw new ArgValidationError(
        info,
        `accessIds[${accesses.indexOf(access)}]`,
        `No reminders left.`,
        {
          errorCode: "NO_REMINDERS_LEFT",
          petitionAccessId: toGlobalId("PetitionAccess", access.id),
        }
      );
    }
  }
}

export function petitionAccessesNotOptedOut(
  accesses: Maybe<PetitionAccess>[],
  info: GraphQLResolveInfo
) {
  for (const access of accesses) {
    if (access && access.reminders_opt_out === true) {
      throw new ArgValidationError(
        info,
        `accessIds[${accesses.indexOf(access)}]`,
        `Petition access must not have opted out from receiving reminders.`,
        {
          errorCode: "REMINDERS_OPT_OUT",
          petitionAccessId: toGlobalId("PetitionAccess", access.id),
        }
      );
    }
  }
}

/**
 * checks that auth token payload contains the required keys
 */
export function validateAuthTokenPayload<TypeName extends string, FieldName extends string>(
  prop: (args: ArgsValue<TypeName, FieldName>) => string | null | undefined,
  requiredKey: string,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const token = prop(args)!;
    const payload: any = decode(token);

    const keys = requiredKey.split(".");
    let data = payload;
    keys.forEach((key) => {
      data = data[key];
      if (!isDefined(data)) {
        throw new ArgValidationError(info, argName, "Invalid token");
      }
    });
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
