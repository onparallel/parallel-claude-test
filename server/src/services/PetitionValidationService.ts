import Ajv from "ajv";
import addFormats from "ajv-formats";
import { inject, injectable } from "inversify";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { difference, isNonNullish, isNullish, omit } from "remeda";
import { PetitionField, PetitionFieldType } from "../db/__types";
import { DynamicSelectOption } from "../graphql/helpers/parseDynamicSelectValues";
import { toBytes } from "../util/fileSize";
import { isGlobalId } from "../util/globalId";
import { never } from "../util/never";
import { isValidDate, isValidDatetime, isValidTimezone } from "../util/time";
import { Maybe } from "../util/types";
import { validateShortTextFormat } from "../util/validateShortTextFormat";
import {
  PETITION_FIELD_SERVICE,
  PetitionFieldOptions,
  PetitionFieldService,
  SCHEMAS,
} from "./PetitionFieldService";

export const PETITION_VALIDATION_SERVICE = Symbol.for("PETITION_VALIDATION_SERVICE");

export class ValidateReplyContentError extends Error {
  constructor(
    public readonly argName: string,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
@injectable()
export class PetitionValidationService {
  constructor(@inject(PETITION_FIELD_SERVICE) private petitionFields: PetitionFieldService) {}

  async validateFieldReplyContent(field: Pick<PetitionField, "type" | "options">, content: any) {
    switch (field.type) {
      case "NUMBER": {
        if (
          !("value" in content) ||
          typeof content.value !== "number" ||
          Number.isNaN(content.value)
        ) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_TYPE_ERROR",
            "Reply must be of type number.",
          );
        }
        const options = field.options as PetitionFieldOptions["NUMBER"];
        const min = options.range?.min ?? -Infinity;
        const max = options.range?.max ?? Infinity;
        if (content.value > max || content.value < min) {
          throw new ValidateReplyContentError(
            "value",
            "OUT_OF_RANGE_ERROR",
            `Reply must be in range [${min}, ${max}].`,
          );
        }
        break;
      }
      case "SELECT": {
        if (!("value" in content) || typeof content.value !== "string") {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_TYPE_ERROR",
            "Reply must be of type string.",
          );
        }
        const options = (await this.petitionFields.loadSelectOptionsValuesAndLabels(field.options))
          .values;
        if (!options.includes(content.value)) {
          throw new ValidateReplyContentError(
            "value",
            "UNKNOWN_OPTION_ERROR",
            "Reply must be one of the available options.",
          );
        }
        break;
      }
      case "DATE": {
        if (!("value" in content) || typeof content.value !== "string") {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_TYPE_ERROR",
            "Reply must be of type string.",
          );
        }
        if (!isValidDate(content.value)) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_VALUE_ERROR",
            "Reply is not a valid date with YYYY-MM-DD format.",
          );
        }
        break;
      }
      case "DATE_TIME": {
        if (typeof content !== "object") {
          throw new ValidateReplyContentError(
            "",
            "INVALID_TYPE_ERROR",
            "Reply must be of type object.",
          );
        }
        if (!("datetime" in content)) {
          throw new ValidateReplyContentError(
            "datetime",
            "INVALID_TYPE_ERROR",
            'Reply is missing a "datetime" key.',
          );
        }
        if (!("timezone" in content)) {
          throw new ValidateReplyContentError(
            "timezone",
            "INVALID_TYPE_ERROR",
            'Reply is missing a "timezone" key.',
          );
        }

        if (!isValidDatetime(content.datetime)) {
          throw new ValidateReplyContentError(
            "datetime",
            "INVALID_VALUE_ERROR",
            `${content.datetime} is not a valid date with YYYY-MM-DDTHH:mm format.`,
          );
        }

        if (!isValidTimezone(content.timezone)) {
          throw new ValidateReplyContentError(
            "timezone",
            "INVALID_VALUE_ERROR",
            `${content.timezone} is not have a valid timezone.`,
          );
        }
        break;
      }
      case "TEXT":
      case "SHORT_TEXT": {
        if (!("value" in content) || typeof content.value !== "string") {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_TYPE_ERROR",
            "Reply must be of type string.",
          );
        }
        const maxLength = (field.options.maxLength as Maybe<number>) ?? Infinity;
        if (content.value.length > maxLength) {
          throw new ValidateReplyContentError(
            "value",
            "MAX_LENGTH_EXCEEDED_ERROR",
            `Reply exceeds max length allowed of ${maxLength} chars.`,
          );
        }
        if (isNonNullish(field.options.format)) {
          if (!validateShortTextFormat(content.value, field.options.format)) {
            throw new ValidateReplyContentError(
              "value",
              "INVALID_FORMAT",
              `Reply is not valid according to format ${field.options.format}.`,
            );
          }
        }
        break;
      }
      case "PHONE": {
        if (!("value" in content) || typeof content.value !== "string") {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_TYPE_ERROR",
            "Reply must be of type string.",
          );
        }
        if (!isPossiblePhoneNumber(content.value)) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_PHONE_NUMBER",
            `${content.value} is not a valid phone number in e164 format`,
          );
        }
        break;
      }
      case "CHECKBOX": {
        if (
          !("value" in content) ||
          !Array.isArray(content.value) ||
          !(content.value as any[]).every((r) => typeof r === "string") ||
          content.value.length === 0
        ) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_TYPE_ERROR",
            "Reply must be an array of strings with at least one value.",
          );
        }

        const options = (await this.petitionFields.loadSelectOptionsValuesAndLabels(field.options))
          .values;
        const { type: subtype, min, max } = field.options.limit;
        if (subtype === "RADIO" && content.value.length !== 1) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_VALUE_ERROR",
            "Reply must contain exactly 1 choice.",
          );
        } else if (
          subtype === "EXACT" &&
          (content.value.length > max || content.value.length < min)
        ) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_VALUE_ERROR",
            `Reply must contain exactly ${min} choice(s).`,
          );
        } else if (
          subtype === "RANGE" &&
          (content.value.length > max || content.value.length < min)
        ) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_VALUE_ERROR",
            `Reply must contain between ${min} and ${max} choices.`,
          );
        }

        const differences = difference(content.value, options);
        if (differences.length !== 0) {
          throw new ValidateReplyContentError(
            "value",
            "UNKNOWN_OPTION_ERROR",
            "Reply must be some of the available options.",
          );
        }
        break;
      }
      case "DYNAMIC_SELECT": {
        if (!("value" in content) || !Array.isArray(content.value)) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_TYPE_ERROR",
            "Reply must be an array with the selected options.",
          );
        }

        const labels = field.options.labels as string[];
        let values = field.options.values as string[] | DynamicSelectOption[];
        if (content.value.length > labels.length) {
          throw new ValidateReplyContentError(
            "value",
            "INVALID_VALUE_ERROR",
            `Reply must be an array of length ${labels.length}.`,
          );
        }
        for (let level = 0; level < labels.length; level++) {
          if (content.value[level]?.[0] !== labels[level]) {
            throw new ValidateReplyContentError(
              `value[${level}][0]`,
              "INVALID_VALUE_ERROR",
              `Expected '${labels[level]}' as label, received '${content.value[level]?.[0]}'.`,
            );
          }
          if (content.value[level]?.[1] === null) {
            if (
              !(content.value as string[][]).slice(level + 1).every(([, value]) => value === null)
            ) {
              throw new ValidateReplyContentError(
                `value[${level}][1]`,
                "INVALID_VALUE_ERROR",
                `A partial reply must contain null values starting from index ${level}.`,
              );
            }
          } else if (level === labels.length - 1) {
            if (!(values as string[]).includes(content.value[level][1]!)) {
              throw new ValidateReplyContentError(
                `value[${level}][1]`,
                "UNKNOWN_OPTION_ERROR",
                `Reply for label '${content.value[level][0]}' must be one of [${(values as string[])
                  .map((opt) => `'${opt}'`)
                  .join(", ")}], received '${content.value[level][1]}'.`,
              );
            }
          } else {
            if (
              !(values as DynamicSelectOption[]).some(
                ([value]) => value === content.value[level][1],
              )
            ) {
              throw new ValidateReplyContentError(
                `value[${level}][1]`,
                "UNKNOWN_OPTION_ERROR",
                `Reply for label '${content.value[level][0]}' must be one of [${(
                  values as DynamicSelectOption[]
                )
                  .map(([opt]) => `'${opt}'`)
                  .join(", ")}], received '${content.value[level][1]}'.`,
              );
            }
            values =
              (values as DynamicSelectOption[]).find(
                ([value]) => value === content.value[level][1],
              )?.[1] ?? [];
          }
        }
        break;
      }
      case "FILE_UPLOAD":
      case "DOW_JONES_KYC":
      case "ES_TAX_DOCUMENTS":
      case "ID_VERIFICATION": {
        if (typeof content !== "object") {
          throw new ValidateReplyContentError(
            "",
            "INVALID_TYPE_ERROR",
            "Reply must be of type object.",
          );
        }
        if (
          !("petitionFieldReplyId" in content) ||
          isNullish(content.petitionFieldReplyId) ||
          !isGlobalId(content.petitionFieldReplyId, "PetitionFieldReply")
        ) {
          throw new ValidateReplyContentError(
            "petitionFieldReplyId",
            "INVALID_VALUE_ERROR",
            "Reply must contain a valid PetitionFieldReply id.",
          );
        }
        break;
      }
      case "PROFILE_SEARCH": {
        /*
         * {
         *    search: string,
         *    totalResults: number,
         *    profileIds: number[],
         * }
         */
        if (typeof content !== "object" || content === null) {
          throw new ValidateReplyContentError(
            "",
            "INVALID_TYPE_ERROR",
            "Reply must be of type object.",
          );
        }

        if (typeof content.search !== "string") {
          throw new ValidateReplyContentError(
            "search",
            "INVALID_STRUCTURE_ERROR",
            "Query must contain a 'search' string.",
          );
        }
        if (typeof content.totalResults !== "number") {
          throw new ValidateReplyContentError(
            "totalResults",
            "INVALID_STRUCTURE_ERROR",
            "Total results must be a number.",
          );
        }
        if (
          !("profileIds" in content) ||
          !Array.isArray(content.profileIds) ||
          !content.profileIds.every(
            (id: unknown) => typeof id === "string" && isGlobalId(id, "Profile"),
          )
        ) {
          throw new ValidateReplyContentError(
            "profileIds",
            "INVALID_STRUCTURE_ERROR",
            "Must be an array of valid profile ids.",
          );
        }
        break;
      }
      case "FIELD_GROUP": {
        if (typeof content !== "object") {
          throw new ValidateReplyContentError(
            "",
            "INVALID_TYPE_ERROR",
            "Reply must be of type object.",
          );
        }
        if (Object.keys(content).length > 0) {
          throw new ValidateReplyContentError("", "INVALID_VALUE_ERROR", "Reply must be empty.");
        }
        break;
      }
      default:
        throw new Error(`Invalid field type '${field.type}'.`);
    }
  }

  async validatePetitionFieldOptions(
    fieldId: number,
    data: { options: Record<string, any> },
    loadFields: (id: number[]) => Promise<(PetitionField | null)[]>,
  ) {
    const [field] = await loadFields([fieldId]);
    if (!field) {
      throw new Error("Petition field not found");
    }

    const options = {
      ...field.options,
      ...(field.type === "FILE_UPLOAD"
        ? omit(data.options, ["maxFileSize"]) // ignore maxFileSize so user can't change it
        : data.options),
      ...(isNonNullish(data.options.documentProcessing) || data.options.processDocument // hardcode maxFileSize and accepts options when setting documentProcessing
        ? {
            maxFileSize: toBytes(10, "MB"), // 10MB is a limit for the Bankflip request. We should review this when implementing a second provider
            accepts: ["PDF", "IMAGE"],
          }
        : {}),
    };

    this.validateFieldOptionsSchema(field.type, options);

    if (isNonNullish(data.options.autoSearchConfig)) {
      await this.validateAutoSearchConfig(field, data.options.autoSearchConfig, loadFields);
    }

    if (["SELECT", "CHECKBOX"].includes(field.type)) {
      const { values, labels } = options as {
        labels?: string[] | null;
        values?: string[] | null;
      };
      if (isNullish(values) && isNonNullish(labels)) {
        throw new Error("Values are required when labels are defined");
      }
      // make sure every or none of the values have a label
      if (isNonNullish(values) && isNonNullish(labels) && values.length !== labels.length) {
        throw new Error("The number of values and labels should match");
      }
      if (isNonNullish(labels) && labels.some((l) => l.trim() === "")) {
        throw new Error("Labels cannot be empty");
      }
      if (isNonNullish(options.values) && isNullish(options.labels)) {
        options.labels = null;
      }
    }

    return { ...field, options };
  }

  validateFieldOptionsSchema(type: PetitionFieldType, options: any) {
    const ajv = new Ajv();
    addFormats(ajv, ["date-time"]);

    ajv.addKeyword({
      keyword: "validateMinMax",
      validate(runValidation: boolean, dataPath: { min: number; max: number }) {
        return runValidation ? dataPath.min <= dataPath.max : true;
      },
    });

    const valid = ajv.validate(SCHEMAS[type], options);
    if (!valid) {
      throw new Error(ajv.errorsText());
    }
  }

  private async validateAutoSearchConfig(
    field: Pick<PetitionField, "petition_id" | "type" | "parent_petition_field_id">,
    autoSearchConfig: any,
    loadFields: (id: number[]) => Promise<(PetitionField | null)[]>,
  ) {
    function isValidField(
      field:
        | Pick<PetitionField, "petition_id" | "type" | "multiple" | "parent_petition_field_id">
        | null
        | undefined,
      type: PetitionFieldType,
      fromField: Pick<PetitionField, "petition_id" | "parent_petition_field_id">,
    ) {
      return (
        isNonNullish(field) &&
        field.petition_id === fromField.petition_id && // fields must belong all to the same petition
        field.type === type && // must be of type SHORT_TEXT
        !field.multiple && // must be "single reply"
        (isNullish(field.parent_petition_field_id) || // must not be a child of another field (children are multiple by default)
          field.parent_petition_field_id === fromField.parent_petition_field_id) // can be a sibling of the BACKGROUND_CHECK field
      );
    }

    if (field.type === "BACKGROUND_CHECK") {
      const config = autoSearchConfig as NonNullable<
        PetitionFieldOptions["BACKGROUND_CHECK"]["autoSearchConfig"]
      >;

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
      const fields = await loadFields(allUsedFieldsIds);

      const isValidNameField = config.name.every((id) => {
        const nameField = fields.find((f) => f?.id === id);
        return isValidField(nameField, "SHORT_TEXT", field);
      });

      const dateField = fields.find((f) => f?.id === config.date);
      const isValidDateField = isNonNullish(config.date)
        ? isValidField(dateField, "DATE", field)
        : true;

      const countryField = fields.find((f) => f?.id === config.country);
      const isValidCountryField = isNonNullish(config.country)
        ? isValidField(countryField, "SELECT", field) &&
          ["COUNTRIES", "EU_COUNTRIES", "NON_EU_COUNTRIES"].includes(
            countryField!.options.standardList,
          )
        : true;

      const birthCountryField = fields.find((f) => f?.id === config.birthCountry);
      const isValidBirthCountryField = isNonNullish(config.birthCountry)
        ? isValidField(birthCountryField, "SELECT", field) &&
          ["COUNTRIES", "EU_COUNTRIES", "NON_EU_COUNTRIES"].includes(
            birthCountryField!.options.standardList,
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
    } else if (field.type === "ADVERSE_MEDIA_SEARCH") {
      const config = autoSearchConfig as NonNullable<
        PetitionFieldOptions["ADVERSE_MEDIA_SEARCH"]["autoSearchConfig"]
      >;
      const fieldIds = [...(config.name ?? []), config.backgroundCheck].filter(isNonNullish);
      if (fieldIds.length === 0) {
        throw new Error("Invalid autoSearchConfig");
      }
      const fields = await loadFields(fieldIds);
      const isValidNameField = (config.name ?? []).every((id) => {
        const nameField = fields.find((f) => f?.id === id);
        return isValidField(nameField, "SHORT_TEXT", field);
      });

      const bgCheckField = fields.find((f) => f?.id === config.backgroundCheck);
      const isValidBgCheckField = isNonNullish(config.backgroundCheck)
        ? isValidField(bgCheckField, "BACKGROUND_CHECK", field)
        : true;

      if (!isValidNameField || !isValidBgCheckField) {
        throw new Error("Invalid autoSearchConfig");
      }
    } else {
      never(`${field.type} cannot have autoSearchConfig`);
    }
  }
}
