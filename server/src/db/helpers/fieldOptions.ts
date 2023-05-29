import Ajv from "ajv";
import addFormats from "ajv-formats";
import { isDefined } from "remeda";
import { CreatePetitionField, PetitionField, PetitionFieldType } from "../__types";

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
  ES_TAX_DOCUMENTS: {
    type: "object",
    // TODO Bankflip Legacy: make "requests" a required property when legacy is removed
    required: ["attachToPdf"],
    additionalProperties: false,
    properties: {
      attachToPdf: {
        type: "boolean",
      },
      // TODO Bankflip Legacy: remove when legacy API is removed
      legacy: {
        type: "boolean",
        description: "set to true to use bankflip legacy API",
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
                type: {
                  type: "string",
                  enum: [
                    "AEAT_036_CENSO_EMPRESARIOS",
                    "AEAT_100_RENTA",
                    "AEAT_111_IRPF_RENDIMIENTOS_TRABAJO_AUTOLIQUIDACION",
                    "AEAT_115_IRPF_RENDIMIENTO_INMUEBLES",
                    "AEAT_130_IRPF_DIRECTA",
                    "AEAT_131_IRPF_OBJETIVA",
                    "AEAT_180_IRPF_RENDIMIENTO_INMUEBLES_RESUMEN",
                    "AEAT_190_IRPF_RENDIMIENTOS_TRABAJO_RESUMEN",
                    "AEAT_303_IVA_AUTOLIQUIDACION",
                    "AEAT_309_IVA_LIQUIDACION_NO_PERIODICA",
                    "AEAT_349_IVA_OPERACIONES_INTRACOMUNITARIAS",
                    "AEAT_390_IVA_RESUMEN",
                    "AEAT_CERT_CENSAL",
                    "AEAT_CERT_IRPF",
                    "AEAT_CERT_OBLIG_TRIB",
                    "DGT_VEHICLE_DATA",
                    "SEG_SOCIAL_BASE_COTIZACIONES",
                    "SEG_SOCIAL_CERT_INTEGRAL_PRESTACIONES",
                    "SEG_SOCIAL_CERT_OBLIG",
                    "SEG_SOCIAL_VIDA_LABORAL",
                  ],
                },
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
      : type === "DOW_JONES_KYC" // DOW_JONES_KYC always true
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
    is_internal: type === "DOW_JONES_KYC" ? true : field?.is_internal ?? false,
    show_in_pdf: type === "DOW_JONES_KYC" ? false : field?.show_in_pdf ?? true,
    alias,
    has_comments_enabled: type === "HEADING" ? false : true,
    require_approval:
      type === "HEADING" || field?.is_internal ? false : field?.require_approval ?? true,
    options,
  };
}

function hasPlaceholder(type: PetitionFieldType) {
  return ["TEXT", "SHORT_TEXT", "SELECT", "NUMBER", "PHONE"].includes(type);
}
