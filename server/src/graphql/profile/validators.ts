import Ajv from "ajv";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { isDefined, uniq } from "remeda";
import { TableTypes } from "../../db/helpers/BaseRepository";
import { validateProfileTypeFieldOptions } from "../../db/helpers/profileTypeFieldOptions";
import { fromGlobalId } from "../../util/globalId";
import { parseTextWithPlaceholders } from "../../util/textWithPlaceholders";
import { isValidDate } from "../../util/time";
import { Maybe } from "../../util/types";
import { NexusGenInputs } from "../__types";
import { Arg } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validProfileNamePattern<
  TypeName extends string,
  FieldName extends string,
  TProfileId extends Arg<TypeName, FieldName, number>,
  TProfileNamePattern extends Arg<TypeName, FieldName, Maybe<string> | undefined>
>(
  profileTypeIdArg: TProfileId,
  profileNamePatternArg: TProfileNamePattern
): FieldValidateArgsResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const profileTypeId = args[profileTypeIdArg] as unknown as number;
    const pattern = args[profileNamePatternArg] as unknown as Maybe<string>;
    if (isDefined(pattern)) {
      const fieldIds = parseTextWithPlaceholders(pattern)
        .filter((p) => p.type === "placeholder")
        .map((p) => fromGlobalId(p.value!, "ProfileTypeField").id);
      const fields = await ctx.profiles.loadProfileTypeField(uniq(fieldIds));
      if (
        fields.length === 0 ||
        fields.some(
          (f) => !isDefined(f) || f.profile_type_id !== profileTypeId || f.type !== "SHORT_TEXT"
        )
      ) {
        throw new ApolloError("Invalid profile name pattern", "INVALID_PROFILE_NAME_PATTERN");
      }
    }
  };
}

export function validProfileFieldValue<
  TypeName extends string,
  FieldName extends string,
  TFieldIdArg extends Arg<TypeName, FieldName, number>,
  TValuedArg extends Arg<TypeName, FieldName, any>
>(profileTypeFieldId: TFieldIdArg, valueArg: TValuedArg) {
  return (async (_, args, ctx, info) => {
    const value = args[valueArg] as any;
    const field = (await ctx.profiles.loadProfileTypeField(
      args[profileTypeFieldId] as unknown as number
    ))!;
    try {
      validateProfileFieldValue(field, value);
    } catch (e) {
      if (e instanceof Error) {
        throw new ApolloError(
          `Invalid profile field value: ${e.message}`,
          "INVALID_PROFILE_FIELD_VALUE"
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validProfileTypeFieldOptions<
  TypeName extends string,
  FieldName extends string,
  TDataArg extends Arg<TypeName, FieldName, NexusGenInputs["CreateProfileTypeFieldInput"]>
>(dataArg: TDataArg, argName: string) {
  return (async (_, args, ctx, info) => {
    const data = args[dataArg] as unknown as NexusGenInputs["CreateProfileTypeFieldInput"];
    if (isDefined(data.options)) {
      try {
        validateProfileTypeFieldOptions(data.type, data.options);
      } catch (e) {
        if (e instanceof Error) {
          throw new ArgValidationError(info, argName, e.message);
        }
        throw e;
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

const STRING_VALUE_SCHEMA = {
  type: "object",
  properties: {
    value: { type: "string" },
  },
  additionalProperties: false,
} as const;

export function validateProfileFieldValue(field: TableTypes["profile_type_field"], content: any) {
  const ajv = new Ajv();
  switch (field.type) {
    case "SHORT_TEXT": {
      const valid = ajv.validate(STRING_VALUE_SCHEMA, content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      if (content.value.includes("\n")) {
        return new Error("Value can't include newlines");
      }
      return;
    }
    case "TEXT": {
      const valid = ajv.validate(STRING_VALUE_SCHEMA, content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      return;
    }
    case "DATE": {
      const valid = ajv.validate(STRING_VALUE_SCHEMA, content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      if (isValidDate(content.value)) {
        return new Error("Value is not a valid datetime");
      }
      return;
    }
    case "PHONE": {
      const valid = ajv.validate(STRING_VALUE_SCHEMA, content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      if (!isPossiblePhoneNumber(content.value)) {
        return new Error("Value is not a valid phone number");
      }
      return;
    }
  }
}
