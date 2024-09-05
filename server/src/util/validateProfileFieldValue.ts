import Ajv from "ajv";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { isNonNullish } from "remeda";
import { TableTypes } from "../db/helpers/BaseRepository";
import { profileTypeFieldSelectValues } from "../db/helpers/profileTypeFieldOptions";
import { isValidDate } from "./time";
import { validateShortTextFormat } from "./validateShortTextFormat";

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
  field: Pick<TableTypes["profile_type_field"], "type" | "options">,
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
      if (isNonNullish(field.options.format)) {
        if (!validateShortTextFormat(content.value, field.options.format)) {
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
      const valid = ajv.validate(
        {
          type: "object",
          properties: {
            value: { type: "string" },
            pretty: { type: "string" },
          },
          additionalProperties: false,
        },
        content,
      );
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
