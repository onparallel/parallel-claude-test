import {
  PetitionStatus,
  Petition,
  PetitionAccess,
  PetitionAccessStatus,
} from "../../db/__types";
import { ArgValidationError } from "../helpers/errors";
import { GraphQLResolveInfo } from "graphql";
import { Maybe } from "../../util/types";
import { toGlobalId } from "../../util/globalId";
import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { decode } from "jsonwebtoken";
import { isDefined } from "../../util/remedaExtensions";

export function validatePetitionStatus(
  petition: Maybe<Petition>,
  status: PetitionStatus,
  info: GraphQLResolveInfo
) {
  if (!petition || petition.status !== status) {
    throw new ArgValidationError(
      info,
      "petitionId",
      `Petition must have status "${status}".`
    );
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

export function validateArgumentIsSet(
  args: any,
  argumentsKey: string,
  info: GraphQLResolveInfo
) {
  if (!args.hasOwnProperty(argumentsKey)) {
    throw new ArgValidationError(
      info,
      argumentsKey,
      `Argument ${argumentsKey} is required.`
    );
  }
}

export function validateAuthToken<
  TypeName extends string,
  FieldName extends string
>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => string | null | undefined,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const token = prop(args)!;

    // check that auth token payload contains a valid petitionId
    const payload: any = decode(token);
    if (!isDefined(payload.petitionId)) {
      throw new ArgValidationError(
        info,
        argName,
        "auth token payload must have a 'petitionId' key"
      );
    }

    const { petitionId } = payload;
    const petition = await ctx.petitions.loadPetition(petitionId);
    if (!petition) {
      throw new ArgValidationError(
        info,
        "token.payload.petitionId",
        `Can't find a petition with id ${petitionId}`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
