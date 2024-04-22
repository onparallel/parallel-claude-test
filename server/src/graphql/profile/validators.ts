import Ajv from "ajv";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { isDefined, uniq } from "remeda";
import { TableTypes } from "../../db/helpers/BaseRepository";
import {
  mapProfileTypeFieldOptions,
  profileTypeFieldSelectValues,
  validateProfileTypeFieldOptions,
} from "../../db/helpers/profileTypeFieldOptions";
import { discriminator } from "../../util/discriminator";
import { fromGlobalId } from "../../util/globalId";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { parseTextWithPlaceholders } from "../../util/slate/placeholders";
import { isValidDate } from "../../util/time";
import { Maybe } from "../../util/types";
import { validateShortTextFormat } from "../../util/validateShortTextFormat";
import { NexusGenInputs } from "../__types";
import { Arg } from "../helpers/authorize";
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
    const profileTypeId = args[profileTypeIdArg] as unknown as number;
    const pattern = args[profileNamePatternArg] as unknown as Maybe<string>;
    if (isDefined(pattern)) {
      const fieldIds = parseTextWithPlaceholders(pattern)
        .filter(discriminator("type", "placeholder" as const))
        .map((p) => fromGlobalId(p.value, "ProfileTypeField").id);
      const fields = await ctx.profiles.loadProfileTypeField(uniq(fieldIds));
      if (
        fields.length === 0 ||
        fields.some(
          (f) =>
            !isDefined(f) ||
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
  TDataArg extends Arg<TypeName, FieldName, NexusGenInputs["CreateProfileTypeFieldInput"]>,
>(profileTypeIdArg: TProfileTypeId, dataArg: TDataArg, argName: string) {
  return (async (_, args, ctx, info) => {
    const profileTypeId = args[profileTypeIdArg] as unknown as number;
    const data = args[dataArg] as unknown as NexusGenInputs["CreateProfileTypeFieldInput"];
    if (isDefined(data.options)) {
      try {
        const options = await mapProfileTypeFieldOptions(
          data.type,
          data.options,
          (type, id) => fromGlobalId(id, type).id,
        );
        await validateProfileTypeFieldOptions(data.type, options, {
          profileTypeId,
          loadProfileTypeField: ctx.profiles.loadProfileTypeField,
        });
      } catch (e) {
        if (e instanceof Error) {
          throw new ArgValidationError(info, argName, e.message);
        }
        throw e;
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

const stringValueSchema = (maxLength?: number) =>
  ({
    type: "object",
    properties: {
      value: { type: "string", maxLength },
    },
    additionalProperties: false,
  }) as const;

const MAX_SHORT_TEXT_SIZE = 1_000;
const MAX_TEXT_SIZE = 10_000;

export async function validateProfileFieldValue(
  field: TableTypes["profile_type_field"],
  content: any,
) {
  const ajv = new Ajv();
  switch (field.type) {
    case "SELECT": {
      const values = await profileTypeFieldSelectValues(field.options);
      if (!values.find((option: any) => content.value === option.value)) {
        throw new Error("Value is not a valid option");
      }
      return;
    }
    case "SHORT_TEXT": {
      if (isDefined(field.options.format)) {
        if (!(await validateShortTextFormat(content.value, field.options.format))) {
          throw new Error(`Value is not valid according to format ${field.options.format}.`);
        }
      }
      const valid = ajv.validate(stringValueSchema(MAX_SHORT_TEXT_SIZE), content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      if (content.value.includes("\n")) {
        throw new Error("Value can't include newlines");
      }
      return;
    }
    case "TEXT": {
      const valid = ajv.validate(stringValueSchema(MAX_TEXT_SIZE), content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }

      return;
    }
    case "DATE": {
      const valid = ajv.validate(stringValueSchema(), content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      if (!isValidDate(content.value)) {
        throw new Error("Value is not a valid datetime");
      }
      return;
    }
    case "PHONE": {
      const valid = ajv.validate(stringValueSchema(), content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      if (!isPossiblePhoneNumber(content.value)) {
        throw new Error("Value is not a valid phone number");
      }
      return;
    }
    case "NUMBER": {
      const valid = ajv.validate(
        {
          type: "object",
          properties: {
            value: { type: "number" },
          },
          additionalProperties: false,
        },
        content,
      );
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
      if (isNaN(Number(content.value))) {
        throw new Error("Value is not a valid number");
      }
      return;
    }
    case "FILE":
      throw new Error("Can't validate file field");
  }
}

export function validProfileTypeFieldSubstitution<
  TypeName extends string,
  FieldName extends string,
  TDataArg extends Arg<TypeName, FieldName, NexusGenInputs["UpdateProfileTypeFieldInput"]>,
>(dataArg: TDataArg, argName: string) {
  return (async (_, args, ctx, info) => {
    const data = args[dataArg] as unknown as NexusGenInputs["UpdateProfileTypeFieldInput"];

    if (isDefined(data.substitutions) && isDefined(data.options?.values)) {
      const values = await profileTypeFieldSelectValues(data.options as any);
      if (
        !data.substitutions.every((s) => !isDefined(s.new) || values.some((v) => v.value === s.new))
      ) {
        throw new ArgValidationError(
          info,
          argName,
          "Every new substitution needs to be a valid option",
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
