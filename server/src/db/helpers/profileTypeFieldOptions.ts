import Ajv from "ajv";
import addFormats from "ajv-formats";
import { ProfileTypeFieldType } from "../__types";

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
    required: [],
    additionalProperties: false,
    properties: {},
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
  return {};
}
