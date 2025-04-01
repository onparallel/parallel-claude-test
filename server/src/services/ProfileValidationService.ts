import DataLoader from "dataloader";
import { injectable } from "inversify";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import pMap from "p-map";
import { isNonNullish } from "remeda";
import { ProfileTypeField } from "../db/__types";
import {
  profileTypeFieldSelectValues,
  STANDARD_LIST_NAMES,
} from "../db/helpers/profileTypeFieldOptions";
import { isValidDate } from "../util/time";
import { validateShortTextFormat } from "../util/validateShortTextFormat";

export const PROFILE_VALIDATION_SERVICE = Symbol.for("PROFILE_VALIDATION_SERVICE");

@injectable()
export class ProfileValidationService {
  private MAX_SHORT_TEXT_SIZE = 1_000;
  private MAX_TEXT_SIZE = 10_000;

  async validateProfileFieldValueContent(
    field: Pick<ProfileTypeField, "type" | "options">,
    content: any,
  ) {
    switch (field.type) {
      case "SELECT": {
        this.assertString(content);

        const values = await this.profileTypeFieldValues(field);
        if (!values.includes(content.value)) {
          throw new Error("Value is not a valid option");
        }
        return;
      }
      case "CHECKBOX": {
        this.assertStringArray(content);

        const values = await this.profileTypeFieldValues(field);
        const invalidValue = content.value.find((value) => !values.includes(value));
        if (isNonNullish(invalidValue)) {
          throw new Error("Value is not a valid option");
        }

        if (new Set(content.value).size !== content.value.length) {
          throw new Error("Can't have repeated values");
        }
        return;
      }
      case "SHORT_TEXT": {
        this.assertString(content, this.MAX_SHORT_TEXT_SIZE);
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
        this.assertString(content, this.MAX_TEXT_SIZE);
        return;
      }
      case "DATE": {
        this.assertString(content);
        if (!isValidDate(content.value)) {
          throw new Error("Value is not a valid datetime");
        }
        return;
      }
      case "PHONE": {
        this.assertPhone(content);
        if (!isPossiblePhoneNumber(content.value)) {
          throw new Error("Value is not a valid phone number");
        }
        return;
      }
      case "NUMBER": {
        this.assertSingleValueProperty(content, "number");

        if (isNaN(Number(content.value))) {
          throw new Error("Value is not a valid number");
        }
        return;
      }
      case "FILE":
        throw new Error("Can't validate file field");
    }
  }

  private readonly standardListValuesDataloader = new DataLoader<
    (typeof STANDARD_LIST_NAMES)[number],
    string[]
  >(async (keys) => {
    return await pMap(
      keys,
      async (standardList) => {
        const data = await profileTypeFieldSelectValues({ standardList, values: [] });
        return data.map((v) => v.value);
      },
      { concurrency: 1 },
    );
  });

  private async profileTypeFieldValues(
    field: Pick<ProfileTypeField, "type" | "options">,
  ): Promise<string[]> {
    return field.options.standardList
      ? await this.standardListValuesDataloader.load(field.options.standardList)
      : (field.options.values as { value: string }[]).map((v) => v.value);
  }

  private assertSingleValueProperty<T extends "string" | "number" | "object">(
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

  private assertString(content: any, maxLength?: number): asserts content is { value: string } {
    this.assertSingleValueProperty(content, "string");
    if (maxLength !== undefined && content.value.length > maxLength) {
      throw new Error(`content value must be ${maxLength} characters or less`);
    }
  }

  private assertStringArray(content: any): asserts content is { value: string[] } {
    this.assertSingleValueProperty(content, "object");
    if (
      !(
        Array.isArray(content.value) &&
        content.value.every((value: any) => typeof value === "string")
      )
    ) {
      throw new Error("content must contain a string array value");
    }
  }

  private assertPhone(content: any): asserts content is { value: string; pretty?: string } {
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
}
