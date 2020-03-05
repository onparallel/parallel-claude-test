import { PetitionFieldType } from "../__types";
import Ajv from "ajv";

const SCHEMAS = {
  TEXT: {
    type: "object",
    required: ["multiline"],
    properties: {
      multiline: {
        type: "boolean"
      }
    }
  },
  FILE_UPLOAD: {
    type: "object",
    required: ["multiple", "accepts"],
    properties: {
      multiple: {
        type: "boolean"
      },
      accepts: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["PDF", "IMAGE", "VIDEO", "DOCUMENT"]
        }
      }
    }
  }
};

export function validateFieldOptions(type: PetitionFieldType, options: any) {
  const ajv = new Ajv();
  const valid = ajv.validate(SCHEMAS[type], options);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
}

export function defaultFieldOptions(type: PetitionFieldType) {
  switch (type) {
    case "TEXT":
      return {
        multiline: true
      };
    case "FILE_UPLOAD":
      return {
        multiple: true,
        accepts: null
      };
  }
}
