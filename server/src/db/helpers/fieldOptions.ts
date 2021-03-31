import { PetitionFieldType, CreatePetitionField } from "../__types";
import Ajv from "ajv";

const SCHEMAS = {
  TEXT: {
    type: "object",
    required: ["multiline", "placeholder"],
    additionalProperties: false,
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
            minItems: 1,
            items: { $ref: "#/definitions/option" },
          },
          labels: {
            type: "array",
            minItems: 1,
            items: {
              type: "string",
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
  const valid = ajv.validate(SCHEMAS[type], options);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
}

export function defaultFieldOptions(
  type: PetitionFieldType
): Partial<CreatePetitionField> {
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
    case "SELECT": {
      return {
        optional: false,
        multiple: false,
        options: {
          values: [],
          placeholder: null,
        },
      };
    }
    case "DYNAMIC_SELECT": {
      return {
        optional: false,
        multiple: false,
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
