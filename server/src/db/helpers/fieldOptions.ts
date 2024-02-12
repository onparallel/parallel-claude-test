import Ajv from "ajv";
import addFormats from "ajv-formats";
import { isDefined } from "remeda";
import { CreatePetitionField, PetitionField, PetitionFieldType } from "../__types";
import { toGlobalId } from "../../util/globalId";

const SCHEMAS = {
  NUMBER: {
    type: "object",
    required: ["range", "decimals"],
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
  DATE_TIME: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  PHONE: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
    },
  },
  TEXT: {
    type: "object",
    required: ["maxLength"],
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
    required: ["maxLength", "format"],
    additionalProperties: false,
    properties: {
      placeholder: {
        type: ["string", "null"],
      },
      maxLength: {
        type: ["integer", "null"],
      },
      format: {
        type: ["string", "null"],
        enum: [
          "EMAIL",
          "IBAN",
          "ES_DNI",
          "ES_NIF",
          "ES_SSN",
          "US_SSN",
          "ES_POSTALCODE",
          "US_POSTALCODE",
          null,
        ],
      },
    },
  },
  FILE_UPLOAD: {
    type: "object",
    required: ["accepts", "attachToPdf"],
    additionalProperties: false,
    properties: {
      accepts: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["PDF", "IMAGE", "VIDEO", "DOCUMENT"],
        },
      },
      attachToPdf: {
        type: "boolean",
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
      labels: {
        type: ["array", "null"],
        items: {
          type: "string",
        },
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
      labels: {
        type: ["array", "null"],
        items: {
          type: "string",
        },
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
  ES_TAX_DOCUMENTS: {
    type: "object",
    required: ["attachToPdf", "requests"],
    additionalProperties: false,
    properties: {
      attachToPdf: {
        type: "boolean",
      },
      requests: {
        type: "array",
        items: {
          type: "object",
          required: ["model"],
          additionalProperties: false,
          properties: {
            model: {
              type: "object",
              required: ["type"],
              additionalProperties: false,
              properties: {
                type: { type: "string" },
                year: { type: "number" },
                month: {
                  type: "string",
                  enum: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
                },
                quarter: { type: "string", enum: ["Q1", "Q2", "Q3", "Q4"] },
                licensePlate: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  DOW_JONES_KYC: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  BACKGROUND_CHECK: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {
      integrationId: {
        type: ["number", "null"],
      },
      autoSearchConfig: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["type", "name", "date"],
        properties: {
          type: {
            type: ["string", "null"],
            enum: ["PERSON", "COMPANY", null],
          },
          name: {
            type: ["array"],
            items: {
              type: "number",
            },
            minItems: 1,
          },
          date: { type: ["number", "null"] },
        },
      },
    },
  },
  FIELD_GROUP: {
    type: "object",
    additionalProperties: false,
    required: ["groupName"],
    properties: {
      groupName: {
        type: ["string", "null"],
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

export function defaultFieldProperties(
  type: PetitionFieldType,
  field?: PetitionField,
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
          : type === "BACKGROUND_CHECK" // BACKGROUND_CHECK always false
            ? false
            : type === "DOW_JONES_KYC" // DOW_JONES_KYC always true
              ? true
              : type === "FIELD_GROUP" // FIELD_GROUP always true
                ? true
                : field?.type === "FILE_UPLOAD" // Inherit if not coming from a FILE_UPLOAD
                  ? false
                  : field?.multiple ?? false;

  const alias = type === "HEADING" ? null : field?.alias ?? null;

  const options = ((): any => {
    switch (type) {
      case "HEADING": {
        return {
          hasPageBreak: false,
        };
      }
      case "TEXT": {
        return {
          placeholder:
            isDefined(field) && hasPlaceholder(field.type)
              ? field.options.placeholder ?? null
              : null,
          maxLength:
            isDefined(field) &&
            ["TEXT", "SHORT_TEXT"].includes(field.type) &&
            isDefined(field.options.maxLength)
              ? field.options.maxLength
              : null,
        };
      }
      case "SHORT_TEXT": {
        return {
          placeholder:
            isDefined(field) && hasPlaceholder(field.type)
              ? field.options.placeholder ?? null
              : null,
          maxLength:
            isDefined(field) &&
            ["TEXT", "SHORT_TEXT"].includes(field.type) &&
            isDefined(field.options.maxLength)
              ? field.options.maxLength
              : null,
          format: null,
        };
      }
      case "BACKGROUND_CHECK": {
        return {
          integrationId: null,
          autoSearchConfig: null,
        };
      }
      case "DOW_JONES_KYC":
      case "DATE_TIME":
      case "DATE": {
        return {};
      }
      case "NUMBER": {
        return {
          placeholder:
            isDefined(field) && hasPlaceholder(field.type)
              ? field.options.placeholder ?? null
              : null,
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
            isDefined(field) && hasPlaceholder(field.type)
              ? field.options.placeholder ?? null
              : null,
        };
      }
      case "SELECT": {
        return {
          values:
            isDefined(field) && ["SELECT", "CHECKBOX"].includes(field.type)
              ? field.options.values
              : [],
          placeholder:
            isDefined(field) && hasPlaceholder(field.type)
              ? field.options.placeholder ?? null
              : null,
        };
      }
      case "FILE_UPLOAD":
        return {
          accepts: null,
          attachToPdf: false,
        };
      case "ES_TAX_DOCUMENTS":
        return {
          attachToPdf: false,
          requests: [
            {
              model: {
                type: "AEAT_IRPF_DATOS_FISCALES",
              },
            },
          ],
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
            type: "RADIO",
            min: optional ?? false ? 0 : 1,
            max: 1,
          },
        };
      }
      case "FIELD_GROUP": {
        return {
          groupName: null,
        };
      }
      default:
        throw new Error();
    }
  })();

  return {
    optional,
    multiple,
    is_internal:
      type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK" ? true : field?.is_internal ?? false,
    show_in_pdf:
      type === "DOW_JONES_KYC" || type === "BACKGROUND_CHECK" ? false : field?.show_in_pdf ?? true,
    alias,
    has_comments_enabled: type === "HEADING" ? false : true,
    require_approval:
      ["HEADING", "FIELD_GROUP"].includes(type) || field?.is_internal
        ? false
        : field?.require_approval ?? true,
    options,
  };
}

function hasPlaceholder(type: PetitionFieldType) {
  return ["TEXT", "SHORT_TEXT", "SELECT", "NUMBER", "PHONE"].includes(type);
}

export function mapFieldOptions(options: any) {
  return {
    ...options,
    ...(options.autoSearchConfig
      ? {
          autoSearchConfig: {
            type: options.autoSearchConfig.type,
            name: options.autoSearchConfig.name.map((id: number) =>
              toGlobalId("PetitionField", id),
            ),
            date: isDefined(options.autoSearchConfig.date)
              ? toGlobalId("PetitionField", options.autoSearchConfig.date)
              : null,
          },
        }
      : {}),
  };
}
