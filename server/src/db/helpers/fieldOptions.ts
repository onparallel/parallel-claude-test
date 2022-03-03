import Ajv from "ajv";
import addFormats from "ajv-formats";
import { isDefined } from "remeda";
import { CreatePetitionField, PetitionField, PetitionFieldType } from "../__types";

const SCHEMAS = {
  NUMBER: {
    type: "object",
    required: ["placeholder", "range", "decimals"],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
      range: {
        type: ["object", "null"],
        properties: {
          min: { type: "number" },
          max: { type: "number" },
        },
      },
      decimals: {
        type: "number",
      },
      prefix: {
        type: ["string", "null"],
      },
      suffix: {
        type: ["string", "null"],
      },
    },
  },
  DATE: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  PHONE: {
    type: "object",
    required: ["placeholder"],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
    },
  },
  TEXT: {
    type: "object",
    required: ["placeholder", "maxLength"],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
      maxLength: {
        type: ["integer", "null"],
      },
    },
  },
  SHORT_TEXT: {
    type: "object",
    required: ["placeholder", "maxLength"],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
      maxLength: {
        type: ["integer", "null"],
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
    required: ["values", "placeholder"],
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
            type: ["object", "null"],
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
  CHECKBOX: {
    type: "object",
    required: ["values", "limit"],
    additionalProperties: false,
    properties: {
      values: {
        type: ["array", "null"],
        items: {
          type: "string",
        },
      },
      limit: {
        type: "object",
        required: ["min", "max", "type"],
        properties: {
          type: {
            type: "string",
            enum: ["RADIO", "UNLIMITED", "EXACT", "RANGE"],
          },
          min: { type: "number" },
          max: { type: "number" },
        },
        validateMinMax: true,
      },
    },
  },
};

export function validateFieldOptions(type: PetitionFieldType, options: any) {
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

export function defaultFieldOptions(
  type: PetitionFieldType,
  field?: PetitionField
): Partial<CreatePetitionField> {
  // Always inherit optional
  const optional = field?.optional ?? false;
  const multiple =
    type === "FILE_UPLOAD" // FILE_UPLOAD always true
      ? true
      : type === "CHECKBOX" // CHECKBOX always false
      ? false
      : type === "HEADING" // HEADING always false
      ? false
      : field?.type === "FILE_UPLOAD" // Inherit if not coming from a FILE_UPLOAD
      ? false
      : field?.multiple ?? false;

  const options = ((): any => {
    switch (type) {
      case "HEADING": {
        return {
          hasPageBreak: false,
        };
      }
      case "TEXT":
      case "SHORT_TEXT": {
        return {
          placeholder:
            isDefined(field) && hasPlaceholder(field.type) ? field.options.placeholder : null,
          maxLength:
            isDefined(field) &&
            ["TEXT", "SHORT_TEXT"].includes(field.type) &&
            isDefined(field.options.maxLength)
              ? field.options.maxLength
              : null,
        };
      }
      case "DATE": {
        return {};
      }
      case "NUMBER": {
        return {
          placeholder:
            isDefined(field) && hasPlaceholder(field.type) ? field.options.placeholder : null,
          range: {
            min: 0,
          },
          decimals: 2,
          prefix: null,
          suffix: null,
        };
      }
      case "PHONE": {
        return {
          placeholder:
            isDefined(field) && hasPlaceholder(field.type) ? field.options.placeholder : null,
        };
      }
      case "SELECT": {
        return {
          values:
            isDefined(field) && ["SELECT", "CHECKBOX"].includes(field.type)
              ? field.options.values
              : [],
          placeholder:
            isDefined(field) && hasPlaceholder(field.type) ? field.options.placeholder : null,
        };
      }
      case "FILE_UPLOAD":
        return {
          accepts: null,
        };
      case "DYNAMIC_SELECT": {
        return {
          file: null,
          values: [],
          labels: [],
        };
      }
      case "CHECKBOX": {
        return {
          values:
            isDefined(field) && ["SELECT", "CHECKBOX"].includes(field.type)
              ? field.options.values
              : [],
          limit: {
            type: "UNLIMITED",
            min: optional ?? false ? 0 : 1,
            max: 1,
          },
        };
      }
      default:
        throw new Error();
    }
  })();

  return {
    optional,
    multiple,
    is_internal: field?.is_internal ?? false,
    show_in_pdf: field?.show_in_pdf ?? true,
    alias: field?.alias ?? null,
    has_comments_enabled: type === "HEADING" ? false : true,
    options,
  };
}

function hasPlaceholder(type: PetitionFieldType) {
  return ["TEXT", "SHORT_TEXT", "SELECT", "NUMBER", "PHONE"].includes(type);
}
