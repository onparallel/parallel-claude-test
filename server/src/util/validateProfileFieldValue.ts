import { isPossiblePhoneNumber } from "libphonenumber-js";
import { isNonNullish } from "remeda";
import { TableTypes } from "../db/helpers/BaseRepository";
import { profileTypeFieldSelectValues } from "../db/helpers/profileTypeFieldOptions";
import { isValidDate } from "./time";
import { validateShortTextFormat } from "./validateShortTextFormat";

function assertSingleValueProperty<T extends "string" | "number" | "object">(
  content: any,
  type: T,
): asserts content is { value: { string: string; number: number; object: any }[T] } {
  if (!content) {
    throw new Error("content is required");
  }
  let keys;
  if (
    !(
      typeof content === "object" &&
      (keys = Object.keys(content)).length === 1 &&
      keys[0] === "value" &&
      typeof content.value === type
    )
  ) {
    throw new Error(`content must contain a single ${type} value property`);
  }
}

function assertString(content: any, maxLength?: number): asserts content is { value: string } {
  assertSingleValueProperty(content, "string");
  if (maxLength !== undefined && content.value.length > maxLength) {
    throw new Error(`content value must be ${maxLength} characters or less`);
  }
}

function assertStringArray(content: any): asserts content is { value: string[] } {
  assertSingleValueProperty(content, "object");
  if (
    !(
      Array.isArray(content.value) && content.value.every((value: any) => typeof value === "string")
    )
  ) {
    throw new Error("content must contain a string array value");
  }
}

function assertPhone(content: any): asserts content is { value: string; pretty?: string } {
  if (!content) {
    throw new Error("content is required");
  }
  let keys;
  if (
    !(
      typeof content === "object" &&
      (keys = Object.keys(content)).includes("value") &&
      typeof content.value === "string"
    )
  ) {
    throw new Error(`content must contain a string value property`);
  }
  if (keys.length >= 2) {
    if (keys.includes("pretty") && typeof content.pretty === "string") {
      // fine
    } else {
      throw new Error(`content must not contain additional properties`);
    }
  }
}

const MAX_SHORT_TEXT_SIZE = 1_000;
const MAX_TEXT_SIZE = 10_000;

export async function validateProfileFieldValue(
  field: Pick<TableTypes["profile_type_field"], "type" | "options">,
  content: any,
) {
  switch (field.type) {
    case "SELECT": {
      assertString(content);
      const values = await profileTypeFieldSelectValues(field.options);
      if (!values.find((option) => content.value === option.value)) {
        throw new Error("Value is not a valid option");
      }
      return;
    }
    case "CHECKBOX": {
      assertStringArray(content);
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
      assertString(content, MAX_SHORT_TEXT_SIZE);
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
      assertString(content, MAX_TEXT_SIZE);
      return;
    }
    case "DATE": {
      assertString(content);
      if (!isValidDate(content.value)) {
        throw new Error("Value is not a valid datetime");
      }
      return;
    }
    case "PHONE": {
      assertPhone(content);
      if (!isPossiblePhoneNumber(content.value)) {
        throw new Error("Value is not a valid phone number");
      }
      return;
    }
    case "NUMBER": {
      assertSingleValueProperty(content, "number");

      if (isNaN(Number(content.value))) {
        throw new Error("Value is not a valid number");
      }
      return;
    }
    case "FILE":
      throw new Error("Can't validate file field");
  }
}
