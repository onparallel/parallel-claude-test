import Ajv from "ajv";
import addFormats from "ajv-formats";
import { ProfileTypeFieldType } from "../__types";
import { LOCALIZABLE_USER_TEXT_SCHEMA } from "../../graphql";
import { FromSchema } from "json-schema-to-ts";

const SCHEMAS = {
  TEXT: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  SHORT_TEXT: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  FILE: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  DATE: {
    type: "object",
    required: ["useReplyAsExpiryDate"],
    additionalProperties: false,
    properties: {
      useReplyAsExpiryDate: { type: "boolean" },
    },
  },
  PHONE: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  NUMBER: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  SELECT: {
    type: "object",
    required: ["values"],
    additionalProperties: false,
    properties: {
      values: {
        type: "array",
        minItems: 1,
        maxItems: 1000,
        items: {
          type: "object",
          required: ["label", "value"],
          properties: {
            label: LOCALIZABLE_USER_TEXT_SCHEMA,
            value: { type: "string", maxLength: 50 },
            color: { type: "string" },
            isStandard: { type: "boolean" },
          },
        },
      },
      showOptionsWithColors: { type: ["boolean", "null"] },
    },
  },
} as const;

export type ProfileTypeFieldOptions = {
  [K in keyof typeof SCHEMAS]: FromSchema<(typeof SCHEMAS)[K]>;
};

export function validateProfileTypeFieldOptions(type: ProfileTypeFieldType, options: any) {
  const ajv = new Ajv();
  addFormats(ajv, ["date-time"]);

  const valid = ajv.validate(SCHEMAS[type], options);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
}

export function defaultProfileTypeFieldOptions(type: ProfileTypeFieldType) {
  if (type === "DATE") {
    return { useReplyAsExpiryDate: false };
  }
  return {};
}
