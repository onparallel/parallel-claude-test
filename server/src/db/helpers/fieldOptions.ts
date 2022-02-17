import { PetitionFieldType, CreatePetitionField, PetitionField } from "../__types";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { isOptionsCompatible, isSettingsCompatible } from "./utils";

const SCHEMAS = {
  NUMBER: {
    type: "object",
    required: ["placeholder"],
    additionalProperties: false,
    properties: {
      hasCommentsEnabled: {
        type: "boolean",
      },
      placeholder: {
        type: ["string", "null"],
      },
      range: {
        type: ["object"],
        properties: {
          min: { type: "number" },
          max: { type: "number" },
        },
      },
    },
  },
  DATE: {
    type: "object",
    additionalProperties: false,
    properties: {
      hasCommentsEnabled: {
        type: "boolean",
      },
    },
  },
  PHONE: {
    type: "object",
    required: ["placeholder", "defaultCountry"],
    additionalProperties: false,
    properties: {
      hasCommentsEnabled: {
        type: "boolean",
      },
      placeholder: {
        type: ["string", "null"],
      },
      defaultCountry: {
        type: "string",
      },
    },
  },
  TEXT: {
    type: "object",
    required: ["placeholder"],
    additionalProperties: false,
    properties: {
      hasCommentsEnabled: {
        type: "boolean",
      },
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
    required: ["placeholder"],
    additionalProperties: false,
    properties: {
      hasCommentsEnabled: {
        type: "boolean",
      },
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
      hasCommentsEnabled: {
        type: "boolean",
      },
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
      hasCommentsEnabled: {
        type: "boolean",
      },
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
      hasCommentsEnabled: {
        type: "boolean",
      },
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
          hasCommentsEnabled: {
            type: "boolean",
          },
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
    required: ["values"],
    additionalProperties: false,
    properties: {
      hasCommentsEnabled: {
        type: "boolean",
      },
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
  let { options, multiple, optional } = field || {};

  if (!field || !isOptionsCompatible(field.type, type)) {
    // check if old field is HEADING for not drag the default disabled option, otherwise take the old value
    options = {
      // common options here
      hasCommentsEnabled: field?.type === "HEADING" ? true : options?.hasCommentsEnabled ?? true,
    };
  }

  if (!field || !isSettingsCompatible(field.type, type)) {
    optional = false;
    multiple = false;
  }

  const commonSettings = {
    optional: optional ?? false,
    multiple: multiple ?? false,
    is_internal: field?.is_internal ?? false,
    show_in_pdf: field?.show_in_pdf ?? true,
    alias: field?.alias ?? null,
  };

  switch (type) {
    case "HEADING": {
      return {
        optional: true,
        multiple: false,
        is_internal: false,
        show_in_pdf: true,
        options: {
          hasCommentsEnabled: false,
          hasPageBreak: false,
        },
      };
    }
    case "TEXT":
    case "SHORT_TEXT": {
      return {
        ...commonSettings,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
          placeholder: options?.placeholder ?? null,
          maxLength: options?.maxLength ?? null,
        },
      };
    }
    case "DATE": {
      return {
        ...commonSettings,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
        },
      };
    }
    case "NUMBER": {
      return {
        ...commonSettings,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
          placeholder: options?.placeholder ?? null,
          range: {
            min: 0,
          },
        },
      };
    }
    case "PHONE": {
      return {
        ...commonSettings,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
          placeholder: options?.placeholder ?? null,
          defaultCountry: "ES",
        },
      };
    }
    case "SELECT": {
      return {
        ...commonSettings,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
          values: options?.values ?? [],
          placeholder: options?.placeholder ?? null,
        },
      };
    }
    case "FILE_UPLOAD":
      return {
        ...commonSettings,
        optional: false,
        multiple: true,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
          accepts: null,
        },
      };
    case "DYNAMIC_SELECT": {
      return {
        ...commonSettings,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
          file: null,
          values: [],
          labels: [],
        },
      };
    }
    case "CHECKBOX": {
      return {
        ...commonSettings,
        multiple: false,
        options: {
          hasCommentsEnabled: options?.hasCommentsEnabled ?? true,
          values: options?.values ?? [],
          limit: {
            type: "UNLIMITED",
            min: optional ?? false ? 0 : 1,
            max: 1,
          },
        },
      };
    }
    default:
      return {};
  }
}
