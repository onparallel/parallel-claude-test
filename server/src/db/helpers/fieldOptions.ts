import { PetitionFieldType, CreatePetitionField } from "../__types";
import Ajv from "ajv";

const SCHEMAS = {
  TEXT: {
    type: "object",
    required: ["multiline", "placeholder"],
    properties: {
      multiline: {
        type: "boolean",
      },
      placeholder: {
        type: ["string", "null"],
      },
    },
  },
  FILE_UPLOAD: {
    type: "object",
    required: ["accepts"],
    properties: {
      accepts: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["PDF", "IMAGE", "VIDEO", "DOCUMENT"],
        },
      },
    },
  },
  HEADING: {
    type: "object",
    required: [],
  },
};

export function validateFieldOptions(type: PetitionFieldType, options: any) {
  const ajv = new Ajv();
  const valid = ajv.validate(SCHEMAS[type], options);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
}

export function defaultFieldOptions(
  type: PetitionFieldType
): Partial<CreatePetitionField> {
  switch (type) {
    case "TEXT":
      return {
        optional: false,
        multiple: false,
        options: {
          multiline: true,
          placeholder: null,
        },
      };
    case "FILE_UPLOAD":
      return {
        optional: false,
        multiple: true,
        options: {
          accepts: null,
        },
      };
    default:
      return {
        optional: true,
      };
  }
}
