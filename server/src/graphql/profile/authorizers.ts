import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isDefined, uniq } from "remeda";
import { ProfileType, ProfileTypeFieldType } from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { NexusGenInputs } from "../__types";
import { Arg, ArgAuthorizer } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";

function createProfileTypeAuthorizer<TRest extends any[] = []>(
  predicate: (profileType: ProfileType, ...rest: TRest) => boolean,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      const profileTypeIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      if (profileTypeIds.length === 0) {
        return true;
      }
      const profileTypes = await ctx.profiles.loadProfileType(profileTypeIds);
      return profileTypes.every(
        (profileType) => isDefined(profileType) && predicate(profileType, ...rest),
      );
    };
  }) as ArgAuthorizer<MaybeArray<number>, TRest>;
}

export const profileTypeIsArchived = createProfileTypeAuthorizer((p) => isDefined(p.archived_at));

export function profileIsAssociatedToPetition<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TPetitionId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileIdArg: TProfileId,
  petitionIdArg: TPetitionId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileIds = uniq(unMaybeArray(args[profileIdArg] as unknown as MaybeArray<number>));
    const petitionIds = uniq(unMaybeArray(args[petitionIdArg] as unknown as MaybeArray<number>));

    const count = await ctx.profiles.countProfilesAssociatedToPetitions(profileIds, petitionIds);

    if (count !== profileIds.length * petitionIds.length) {
      throw new ApolloError("Profile not associated to petition", "PROFILE_ASSOCIATION_ERROR");
    }

    return true;
  };
}

export function userHasAccessToProfileType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(profileTypeIdArg: TProfileTypeId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(args[profileTypeIdArg] as unknown as MaybeArray<number>);

      const profileTypes = await ctx.profiles.loadProfileType(ids);
      return profileTypes.every((p) => isDefined(p) && p.org_id === ctx.user!.org_id);
    } catch {}
    return false;
  };
}

export function profileTypeFieldBelongsToProfileType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TProfileTypeId extends Arg<TypeName, FieldName, number>,
>(
  profileTypeFieldIdArg: TProfileTypeFieldId,
  profileTypeIdArg: TProfileTypeId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileTypeFieldIds = unMaybeArray(
        args[profileTypeFieldIdArg] as unknown as MaybeArray<number>,
      );
      const profileTypeId = args[profileTypeIdArg] as unknown as number;

      const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);
      return profileTypeFields.every((p) => isDefined(p) && p.profile_type_id === profileTypeId);
    } catch {
      return false;
    }
  };
}

export function profileHasProfileTypeFieldId<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, number>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileIdArg: TProfileId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileId = args[profileIdArg] as unknown as number;
      const profileTypeFieldIds = unMaybeArray(
        args[profileTypeFieldIdArg] as unknown as MaybeArray<number>,
      );
      const [profileTypeFields, profile] = await Promise.all([
        ctx.profiles.loadProfileTypeField(profileTypeFieldIds),
        ctx.profiles.loadProfile(profileId),
      ]);
      return (
        isDefined(profile) &&
        profileTypeFields.every(
          (p) => isDefined(p) && p.profile_type_id === profile.profile_type_id,
        )
      );
    } catch {
      return false;
    }
  };
}

export function profileFieldFileHasProfileTypeFieldId<
  TypeName extends string,
  FieldName extends string,
  TProfileFieldFileId extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, number>,
>(
  profileFieldFileIdArg: TProfileFieldFileId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileFieldFileIds = unMaybeArray(
        args[profileFieldFileIdArg] as unknown as MaybeArray<number>,
      );
      const profileTypeFieldId = args[profileTypeFieldIdArg] as unknown as number;
      const profileFieldFiles = await ctx.profiles.loadProfileFieldFileById(profileFieldFileIds);

      return profileFieldFiles.every((pff) => pff?.profile_type_field_id === profileTypeFieldId);
    } catch {
      return false;
    }
  };
}

export function profileTypeFieldIsOfType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  profileTypeFieldIdArg: TProfileTypeFieldId,
  types: ProfileTypeFieldType[],
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileTypeFieldIds = unMaybeArray(
        args[profileTypeFieldIdArg] as unknown as MaybeArray<number>,
      );
      const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);

      return profileTypeFields.every((p) => isDefined(p) && types.includes(p.type));
    } catch {
      return false;
    }
  };
}

export function userHasAccessToProfile<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(profileIdArg: TProfileId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(args[profileIdArg] as unknown as MaybeArray<number>);

      const profiles = await ctx.profiles.loadProfile(ids);
      return profiles.every((p) => isDefined(p) && p.org_id === ctx.user!.org_id);
    } catch {
      return false;
    }
  };
}

export function fileUploadCanBeAttachedToProfileTypeField<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, number>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, number>,
  TData extends Arg<TypeName, FieldName, NexusGenInputs["FileUploadInput"][]>,
>(
  profileIdArg: TProfileId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
  dataArg: TData,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileId = args[profileIdArg] as unknown as number;
    const profileTypeFieldId = args[profileTypeFieldIdArg] as unknown as number;
    const data = args[dataArg] as unknown as NexusGenInputs["FileUploadInput"][];
    const files = await ctx.profiles.loadProfileFieldFiles({ profileId, profileTypeFieldId });

    if ((files ?? []).length + data.length > 10) {
      throw new ApolloError(
        "You cannot upload more than 10 files on the same profile field",
        "MAX_FILES_EXCEEDED",
      );
    }
    return true;
  };
}

export function contextUserCanSubscribeUsersToProfile<
  TypeName extends string,
  FieldName extends string,
  TUserIdsArg extends Arg<TypeName, FieldName, number[]>,
>(userIdsArg: TUserIdsArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = uniq(args[userIdsArg] as unknown as number[]);

    const users = await ctx.users.loadUser(userIds);

    // every user has to belong to same organization as context user
    if (users.some((u) => !isDefined(u) || u.org_id !== ctx.user!.org_id)) {
      return false;
    }

    // collaborators can only subscribe/unsubscribe themselves
    if (userIds.some((id) => id !== ctx.user!.id)) {
      const userPermissions = await ctx.users.loadUserPermissions(ctx.user!.id);
      return userPermissions.includes("PROFILES:SUBSCRIBE_PROFILES");
    }
    return true;
  };
}
