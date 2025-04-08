import { isNonNullish, isNullish, unique } from "remeda";
import { discriminator } from "../../util/discriminator";
import { fromGlobalId } from "../../util/globalId";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { parseTextWithPlaceholders } from "../../util/slate/placeholders";
import { Maybe } from "../../util/types";
import { NexusGenInputs } from "../__types";
import { Arg, ArgWithPath, getArg, getArgWithPath } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validProfileNamePattern<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, number>,
  TProfileNamePattern extends Arg<TypeName, FieldName, Maybe<string> | undefined>,
>(
  profileTypeIdArg: TProfileId,
  profileNamePatternArg: TProfileNamePattern,
): FieldValidateArgsResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileTypeId = getArg(args, profileTypeIdArg);
    const pattern = getArg(args, profileNamePatternArg);
    if (isNonNullish(pattern)) {
      const fieldIds = parseTextWithPlaceholders(pattern)
        .filter(discriminator("type", "placeholder" as const))
        .map((p) => fromGlobalId(p.value, "ProfileTypeField").id);
      const fields = await ctx.profiles.loadProfileTypeField(unique(fieldIds));
      if (
        fields.length === 0 ||
        fields.some(
          (f) =>
            isNullish(f) ||
            f.profile_type_id !== profileTypeId ||
            !["SHORT_TEXT", "SELECT"].includes(f.type) ||
            !isAtLeast(f.permission, "READ"),
        )
      ) {
        throw new ApolloError("Invalid profile name pattern", "INVALID_PROFILE_NAME_PATTERN");
      }
    }
  };
}

export function validProfileTypeFieldOptions<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeId extends Arg<TypeName, FieldName, number>,
  TDataArg extends ArgWithPath<TypeName, FieldName, NexusGenInputs["CreateProfileTypeFieldInput"]>,
>(profileTypeIdArg: TProfileTypeId, dataArg: TDataArg) {
  return (async (_, args, ctx, info) => {
    const profileTypeId = getArg(args, profileTypeIdArg);
    const [data, argName] = getArgWithPath(args, dataArg);
    if (isNonNullish(data.options)) {
      try {
        const options = await ctx.profileTypeFields.mapProfileTypeFieldOptions(
          data.type,
          data.options,
          (type, id) => fromGlobalId(id, type).id,
        );
        await ctx.profileValidation.validateProfileTypeFieldOptions(
          data.type,
          options,
          profileTypeId,
        );
      } catch (e) {
        if (e instanceof Error) {
          throw new ArgValidationError(info, argName, e.message);
        }
        throw e;
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validProfileTypeFieldSubstitution<
  TypeName extends string,
  FieldName extends string,
  TDataArg extends ArgWithPath<TypeName, FieldName, NexusGenInputs["UpdateProfileTypeFieldInput"]>,
>(dataArg: TDataArg) {
  return (async (_, args, ctx, info) => {
    const [data, argName] = getArgWithPath(args, dataArg);

    if (isNonNullish(data.substitutions) && isNonNullish(data.options?.values)) {
      const values = await ctx.profileTypeFields.loadProfileTypeFieldSelectValues(
        data.options as any,
      );
      if (
        !data.substitutions.every((s) => isNullish(s.new) || values.some((v) => v.value === s.new))
      ) {
        throw new ArgValidationError(
          info,
          `${argName}.substitutions`,
          "Every new substitution needs to be a valid option",
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
