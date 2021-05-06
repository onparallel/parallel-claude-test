import {
  PetitionFieldType,
  CreatePetitionField,
  PetitionField,
} from "../__types";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { isOptionsCompatible } from "./utils";

const SCHEMAS = {
  TEXT: {
    type: "object",
    required: ["placeholder"],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
    },
  },
  SHORT_TEXT: {
    type: "object",
    required: ["placeholder"],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
    },
  },
  FILE_UPLOAD: {
    type: "object",
    required: ["accepts"],
    additionalProperties: false,
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
    required: ["hasPageBreak"],
    additionalProperties: false,
    properties: {
      hasPageBreak: {
        type: "boolean",
      },
    },
  },
  SELECT: {
    type: "object",
    required: ["values"],
    additionalProperties: false,
    properties: {
      values: {
        type: ["array", "null"],
        items: {
          type: "string",
        },
      },
      placeholder: {
        type: ["string", "null"],
      },
    },
  },
  DYNAMIC_SELECT: {
    definitions: {
      option: {
        type: "array",
        minItems: 2,
        additionalItems: false,
        items: [
          { type: "string" },
          {
            type: "array",
            items: {
              oneOf: [{ $ref: "#/definitions/option" }, { type: "string" }],
            },
          },
        ],
      },
      root: {
        type: "object",
        required: ["values", "labels"],
        additionalProperties: false,
        properties: {
          values: {
            type: "array",
            items: { $ref: "#/definitions/option" },
          },
          labels: {
            type: "array",
            items: {
              type: "string",
            },
          },
          file: {
            type: "object",
            required: ["id", "name", "size", "updatedAt"],
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              size: { type: "integer" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    $ref: "#/definitions/root",
  },
};

export function validateFieldOptions(type: PetitionFieldType, options: any) {
  const ajv = new Ajv();
  addFormats(ajv, ["date-time"]);
  const valid = ajv.validate(SCHEMAS[type], options);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
}

export function defaultFieldOptions(
  type: PetitionFieldType,
  field?: PetitionField
): Partial<CreatePetitionField> {
  let { options, multiple, optional } = field || {};

  if (!field || !isOptionsCompatible(field.type, type)) {
    options = {};
    optional = false;
    multiple = false;
  }

  switch (type) {
    case "HEADING": {
      return {
        optional: true,
        multiple: false,
        options: {
          hasPageBreak: false,
        },
      };
    }
    case "TEXT":
      return {
        optional: optional ?? false,
        multiple: multiple ?? false,
        options: {
          placeholder: options?.placeholder ?? null,
        },
      };
    case "SHORT_TEXT":
      return {
        optional: optional ?? false,
        multiple: multiple ?? false,
        options: {
          placeholder: options?.placeholder ?? null,
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
    case "SELECT": {
      return {
        optional: optional ?? false,
        multiple: multiple ?? false,
        options: {
          values: [],
          placeholder: options?.placeholder ?? null,
        },
      };
    }
    case "DYNAMIC_SELECT": {
      return {
        optional: optional ?? false,
        multiple: multiple ?? false,
        options: {
          values: [],
          labels: [],
        },
      };
    }
    default:
      return {};
  }
}
