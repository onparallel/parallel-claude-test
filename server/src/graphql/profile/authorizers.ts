import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isDefined, uniq } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { fromGlobalId } from "../../util/globalId";
import { parseTextWithPlaceholders } from "../../util/textWithPlaceholders";
import { Maybe, MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToProfileType<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeId extends Arg<TypeName, FieldName, MaybeArray<number>>
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
  TProfileTypeId extends Arg<TypeName, FieldName, number>
>(
  profileTypeFieldIdArg: TProfileTypeFieldId,
  profileTypeIdArg: TProfileTypeId
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileTypeFieldIds = unMaybeArray(
        args[profileTypeFieldIdArg] as unknown as MaybeArray<number>
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
  TProfileTypeFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  profileIdArg: TProfileId,
  profileTypeFieldIdArg: TProfileTypeFieldId
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileId = args[profileIdArg] as unknown as number;
      const profileTypeFieldIds = unMaybeArray(
        args[profileTypeFieldIdArg] as unknown as MaybeArray<number>
      );
      const [profileTypeFields, profile] = await Promise.all([
        ctx.profiles.loadProfileTypeField(profileTypeFieldIds),
        ctx.profiles.loadProfile(profileId),
      ]);
      return (
        isDefined(profile) &&
        profileTypeFields.every(
          (p) => isDefined(p) && p.profile_type_id === profile!.profile_type_id
        )
      );
    } catch {
      return false;
    }
  };
}

export function userHasAccessToProfile<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, MaybeArray<number>>
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

export function validProfileNamePattern<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, number>,
  TProfileNamePattern extends Arg<TypeName, FieldName, Maybe<string> | undefined>
>(
  profileTypeIdArg: TProfileId,
  profileNamePatternArg: TProfileNamePattern
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const profileTypeId = args[profileTypeIdArg] as unknown as number;
      const pattern = args[profileNamePatternArg] as unknown as Maybe<string>;
      if (isDefined(pattern)) {
        const fieldIds = parseTextWithPlaceholders(pattern)
          .filter((p) => p.type === "placeholder" && p.value.match(/^\d+$/))
          .map((p) => fromGlobalId(p.value!, "ProfileTypeField").id);
        const fields = await ctx.profiles.loadProfileTypeField(uniq(fieldIds));
        return fields.every(
          (f) => isDefined(f) && f.profile_type_id === profileTypeId && f.type === "SHORT_TEXT"
        );
      }
      return true;
    } catch {
      return false;
    }
  };
}
