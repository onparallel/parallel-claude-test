import Ajv from "ajv";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { isDefined, uniq } from "remeda";
import { TableTypes } from "../../db/helpers/BaseRepository";
import { validateProfileTypeFieldOptions } from "../../db/helpers/profileTypeFieldOptions";
import { discriminator } from "../../util/discriminator";
import { fromGlobalId } from "../../util/globalId";
import { isValidDate } from "../../util/time";
import { Maybe } from "../../util/types";
import { NexusGenInputs } from "../__types";
import { Arg } from "../helpers/authorize";
import { ApolloError, ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { parseTextWithPlaceholders } from "../../util/slate/placeholders";

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
        .filter(discriminator("type", "placeholder" as const))
        .map((p) => fromGlobalId(p.value, "ProfileTypeField").id);
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

const stringValueSchema = (maxLength?: number) =>
  ({
    type: "object",
    properties: {
      value: { type: "string", maxLength },
    },
    additionalProperties: false,
  } as const);

const MAX_SHORT_TEXT_SIZE = 1_000;
const MAX_TEXT_SIZE = 10_000;

export function validateProfileFieldValue(field: TableTypes["profile_type_field"], content: any) {
  const ajv = new Ajv();
  switch (field.type) {
    case "SHORT_TEXT": {
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
  }
}
