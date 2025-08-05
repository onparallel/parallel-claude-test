import Ajv from "ajv";
import addFormats from "ajv-formats";
import { inject, injectable } from "inversify";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { difference, isNonNullish, isNullish, unique } from "remeda";
import { ProfileTypeField, ProfileTypeFieldType } from "../db/__types";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { isValidDate } from "../util/time";
import { validateShortTextFormat } from "../util/validateShortTextFormat";
import {
  PROFILE_TYPE_FIELD_SERVICE,
  ProfileTypeFieldActivationCondition,
  ProfileTypeFieldOptions,
  ProfileTypeFieldService,
  SCHEMAS,
} from "./ProfileTypeFieldService";

export const PROFILE_VALIDATION_SERVICE = Symbol.for("PROFILE_VALIDATION_SERVICE");

@injectable()
export class ProfileValidationService {
  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(PROFILE_TYPE_FIELD_SERVICE)
    private profileTypeFields: ProfileTypeFieldService,
  ) {}

  private MAX_SHORT_TEXT_SIZE = 1_000;
  private MAX_TEXT_SIZE = 10_000;

  async validateProfileFieldValueContent(
    field: Pick<ProfileTypeField, "type" | "options">,
    content: any,
  ) {
    switch (field.type) {
      case "SELECT": {
        this.assertString(content);

        const values = await this.profileTypeFields.loadProfileTypeFieldSelectValues(field.options);
        if (!values.some((v) => v.value === content.value)) {
          throw new Error("Value is not a valid option");
        }
        return;
      }
      case "CHECKBOX": {
        this.assertStringArray(content);

        const values = await this.profileTypeFields.loadProfileTypeFieldSelectValues(field.options);
        const invalidValue = content.value.find((value) => !values.some((v) => v.value === value));
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
          throw new Error("Value is not a valid date");
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

  async validateProfileTypeFieldOptions(
    type: ProfileTypeFieldType,
    options: any,
    profileTypeId: number,
  ) {
    const ajv = new Ajv();
    addFormats(ajv, ["date-time"]);

    const valid = ajv.validate(SCHEMAS[type], options);
    if (!valid) {
      throw new Error(ajv.errorsText());
    }

    if (
      isNonNullish(options.monitoring) &&
      (type === "BACKGROUND_CHECK" || type === "ADVERSE_MEDIA_SEARCH")
    ) {
      await this.validateMonitoringOptions(options.monitoring, profileTypeId);
    }

    if (isNonNullish(options.autoSearchConfig) && type === "BACKGROUND_CHECK") {
      await this.validateAutoSearchConfig(options.autoSearchConfig, profileTypeId);
    }
  }

  private async validateActivationCondition(
    activationCondition: ProfileTypeFieldActivationCondition,
    profileTypeId: number,
  ) {
    const profileTypeField = await this.profiles.loadProfileTypeField(
      activationCondition.profileTypeFieldId,
    );
    if (
      !profileTypeField ||
      profileTypeField.type !== "SELECT" ||
      profileTypeField.profile_type_id !== profileTypeId
    ) {
      throw new Error("Invalid profileTypeFieldId");
    }

    // make sure every value in activation conditions is a valid option on SELECT field
    const selectValues = unique(
      (await this.profileTypeFields.loadProfileTypeFieldSelectValues(profileTypeField.options)).map(
        (v) => v.value,
      ),
    );
    if (
      !unique(activationCondition.values).every((activationValue) =>
        selectValues.includes(activationValue),
      )
    ) {
      throw new Error("Invalid activation values");
    }
  }

  private async validateMonitoringOptions(
    monitoring: NonNullable<
      ProfileTypeFieldOptions["BACKGROUND_CHECK" | "ADVERSE_MEDIA_SEARCH"]["monitoring"]
    >,
    profileTypeId: number,
  ) {
    if (isNonNullish(monitoring.activationCondition)) {
      await this.validateActivationCondition(monitoring.activationCondition, profileTypeId);
    }

    if (monitoring?.searchFrequency.type === "VARIABLE") {
      const profileTypeField = await this.profiles.loadProfileTypeField(
        monitoring.searchFrequency.profileTypeFieldId,
      );
      if (
        !profileTypeField ||
        profileTypeField.type !== "SELECT" ||
        profileTypeField.profile_type_id !== profileTypeId
      ) {
        throw new Error("Invalid profileTypeFieldId");
      }

      // every SELECT value has to be set on variable searchFrequency options
      const selectValues = unique(
        (
          await this.profileTypeFields.loadProfileTypeFieldSelectValues(
            profileTypeField.options as ProfileTypeFieldOptions["SELECT"],
          )
        ).map((v) => v.value),
      );
      const searchFrequencyValues = unique(monitoring.searchFrequency.options.map((o) => o.value));
      if (
        selectValues.length !== searchFrequencyValues.length ||
        difference(selectValues, searchFrequencyValues).length !== 0
      ) {
        throw new Error("Invalid variable searchFrequency options");
      }
    }
  }

  private async validateAutoSearchConfig(
    config: NonNullable<ProfileTypeFieldOptions["BACKGROUND_CHECK"]["autoSearchConfig"]>,
    profileTypeId: number,
  ) {
    if (isNonNullish(config.birthCountry) && config.type !== "PERSON") {
      throw new Error("Invalid autoSearchConfig");
    }

    const allUsedFieldsIds = [
      ...config.name,
      config.date,
      config.country,
      config.birthCountry,
    ].filter(isNonNullish);

    if (allUsedFieldsIds.length === 0) {
      throw new Error("Invalid autoSearchConfig");
    }
    const fields = await this.profiles.loadProfileTypeField(allUsedFieldsIds);

    if (fields.some((f) => isNullish(f) || f.profile_type_id !== profileTypeId)) {
      throw new Error("Invalid autoSearchConfig");
    }

    const isValidNameField = config.name.every((id) =>
      fields.some((f) => f!.id === id && f!.type === "SHORT_TEXT"),
    );

    const isValidDateField = isNonNullish(config.date)
      ? fields.some((f) => f!.id === config.date && f!.type === "DATE")
      : true;

    const isValidCountryField = isNonNullish(config.country)
      ? fields.some(
          (f) =>
            f!.id === config.country &&
            f!.type === "SELECT" &&
            ["COUNTRIES", "EU_COUNTRIES", "NON_EU_COUNTRIES"].includes(f!.options.standardList),
        )
      : true;

    const isValidBirthCountryField = isNonNullish(config.birthCountry)
      ? fields.some(
          (f) =>
            f!.id === config.birthCountry &&
            f!.type === "SELECT" &&
            ["COUNTRIES", "EU_COUNTRIES", "NON_EU_COUNTRIES"].includes(f!.options.standardList),
        )
      : true;

    if (
      !isValidNameField ||
      !isValidDateField ||
      !isValidCountryField ||
      !isValidBirthCountryField
    ) {
      throw new Error("Invalid autoSearchConfig");
    }

    if (isNonNullish(config.activationCondition)) {
      await this.validateActivationCondition(config.activationCondition, profileTypeId);
    }
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
