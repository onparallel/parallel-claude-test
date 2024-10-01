import Ajv from "ajv";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { isNonNullish } from "remeda";
import { TableTypes } from "../db/helpers/BaseRepository";
import { profileTypeFieldSelectValues } from "../db/helpers/profileTypeFieldOptions";
import { JsonSchemaFor } from "./jsonSchema";
import { isValidDate } from "./time";
import { validateShortTextFormat } from "./validateShortTextFormat";

const stringValueSchema = (maxLength?: number) =>
  ({
    type: "object",
    required: ["value"],
    properties: {
      value: { type: "string", maxLength },
    },
    additionalProperties: false,
  }) as JsonSchemaFor<{ value: string }>;

const stringArrayValueSchema = () =>
  ({
    type: "object",
    required: ["value"],
    properties: {
      value: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
  }) as JsonSchemaFor<{ value: string[] }>;

const MAX_SHORT_TEXT_SIZE = 1_000;
const MAX_TEXT_SIZE = 10_000;

export async function validateProfileFieldValue(
  field: Pick<TableTypes["profile_type_field"], "type" | "options">,
  content: any,
) {
  const ajv = new Ajv();

  function assertContent<T>(schema: JsonSchemaFor<T>, content: any): asserts content is T {
    if (!content) {
      throw new Error("Content is required");
    }
    const valid = ajv.validate(schema, content);
    if (!valid) {
      throw new Error(ajv.errorsText());
    }
  }

  switch (field.type) {
    case "SELECT": {
      assertContent(stringValueSchema(), content);

      const values = await profileTypeFieldSelectValues(field.options);
      if (!values.find((option) => content.value === option.value)) {
        throw new Error("Value is not a valid option");
      }
      return;
    }
    case "CHECKBOX": {
      assertContent(stringArrayValueSchema(), content);

      const values = await profileTypeFieldSelectValues(field.options);
      const invalidValue = content.value.find(
        (value) => !values.find((option) => value === option.value),
      );

      if (isNonNullish(invalidValue)) {
        throw new Error("Value is not a valid option");
      }

      if (new Set(content.value).size !== content.value.length) {
        throw new Error("Can't have repeated values");
      }
      return;
    }
    case "SHORT_TEXT": {
      assertContent(stringValueSchema(MAX_SHORT_TEXT_SIZE), content);

      if (isNonNullish(field.options.format)) {
        if (!validateShortTextFormat(content.value, field.options.format)) {
          throw new Error(`Value is not valid according to format ${field.options.format}.`);
        }
      }
      if (content.value.includes("\n")) {
        throw new Error("Value can't include newlines");
      }
      return;
    }
    case "TEXT": {
      assertContent(stringValueSchema(MAX_TEXT_SIZE), content);
      return;
    }
    case "DATE": {
      assertContent(stringValueSchema(), content);
      if (!isValidDate(content.value)) {
        throw new Error("Value is not a valid datetime");
      }
      return;
    }
    case "PHONE": {
      assertContent<{ value: string; pretty?: string }>(
        {
          type: "object",
          required: ["value"],
          properties: {
            value: { type: "string" },
            pretty: { type: "string" },
          },
          additionalProperties: false,
        },
        content,
      );
      if (!isPossiblePhoneNumber(content.value)) {
        throw new Error("Value is not a valid phone number");
      }
      return;
    }
    case "NUMBER": {
      assertContent<{ value: number }>(
        {
          type: "object",
          required: ["value"],
          properties: {
            value: { type: "number" },
          },
          additionalProperties: false,
        },
        content,
      );

      if (isNaN(Number(content.value))) {
        throw new Error("Value is not a valid number");
      }
      return;
    }
    case "FILE":
      throw new Error("Can't validate file field");
  }
}
