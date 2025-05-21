import DataLoader from "dataloader";
import { fromZonedTime } from "date-fns-tz";
import { injectable } from "inversify";
import { FromSchema } from "json-schema-to-ts";
import pMap from "p-map";
import { join } from "path";
import { isNonNullish, omit, pick } from "remeda";
import {
  ContactLocale,
  CreatePetitionField,
  DocumentProcessingTypeValues,
  PetitionField,
  PetitionFieldType,
  TableTypes,
} from "../db/__types";
import { fromGlobalId, toGlobalId } from "../util/globalId";
import { Maybe } from "../util/types";

const EU_COUNTRIES =
  "AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE".split(",");

const STANDARD_LIST_NAMES = [
  "COUNTRIES",
  "EU_COUNTRIES",
  "NON_EU_COUNTRIES",
  "CURRENCIES",
  "NACE",
  "CNAE",
  "SIC",
] as const;

export const SCHEMAS = {
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
      replyOnlyFromProfile: {
        type: "boolean",
      },
    },
  },
  DATE: {
    type: "object",
    additionalProperties: false,
    properties: {
      replyOnlyFromProfile: {
        type: "boolean",
      },
    },
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
      replyOnlyFromProfile: {
        type: "boolean",
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
      replyOnlyFromProfile: {
        type: "boolean",
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
      replyOnlyFromProfile: {
        type: "boolean",
      },
    },
  },
  FILE_UPLOAD: {
    type: "object",
    required: ["accepts", "attachToPdf"],
    additionalProperties: false,
    properties: {
      maxFileSize: {
        type: ["number", "null"],
      },
      accepts: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["PDF", "IMAGE"],
        },
      },
      documentProcessing: {
        type: ["object", "null"],
        required: ["integrationId", "processDocumentAs"],
        additionalProperties: false,
        properties: {
          integrationId: {
            type: ["number", "null"],
          },
          processDocumentAs: {
            type: "string",
            enum: DocumentProcessingTypeValues,
          },
        },
      },
      processDocument: {
        description: "Whether to enable AI document processing for this field",
        type: "boolean",
      },
      attachToPdf: {
        type: "boolean",
      },
      replyOnlyFromProfile: {
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
      showNumbering: {
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
        maxItems: 1000,
        items: {
          type: "string",
          maxLength: 2000,
        },
      },
      values: {
        type: "array",
        maxItems: 1000,
        items: {
          type: "string",
          maxLength: 2000,
        },
      },
      placeholder: {
        type: ["string", "null"],
      },
      standardList: {
        type: ["string", "null"],
        enum: [...STANDARD_LIST_NAMES, null],
      },
      replyOnlyFromProfile: {
        type: "boolean",
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
        maxItems: 1000,
        items: {
          type: "string",
          maxLength: 2000,
        },
      },
      values: {
        type: "array",
        maxItems: 1000,
        items: {
          type: "string",
          maxLength: 2000,
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
      standardList: {
        type: ["string", "null"],
        enum: [...STANDARD_LIST_NAMES, null],
      },
      replyOnlyFromProfile: {
        type: "boolean",
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
      identityVerification: {
        type: "object",
        required: ["type"],
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["simple", "extended"],
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
        required: ["type", "name", "date", "country"],
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
          country: { type: ["number", "null"] },
        },
      },
      replyOnlyFromProfile: {
        type: "boolean",
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
  ID_VERIFICATION: {
    type: "object",
    required: ["attachToPdf", "integrationId", "config"],
    additionalProperties: false,
    properties: {
      attachToPdf: {
        type: "boolean",
      },
      integrationId: {
        type: ["number", "null"],
      },
      config: {
        type: "object",
        required: ["type", "allowedDocuments"],
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["SIMPLE", "EXTENDED"],
          },
          allowedDocuments: {
            type: "array",
            minItems: 1,
            items: {
              type: "string",
              enum: ["ID_CARD", "PASSPORT", "RESIDENCE_PERMIT", "DRIVER_LICENSE"],
            },
          },
        },
      },
    },
  },
  PROFILE_SEARCH: {
    type: "object",
    additionalProperties: false,
    required: ["searchIn"],
    properties: {
      searchIn: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["profileTypeId", "profileTypeFieldIds"],
          properties: {
            profileTypeId: {
              type: "number",
            },
            profileTypeFieldIds: {
              type: "array",
              items: {
                type: "number",
              },
            },
          },
        },
      },
    },
  },
  ADVERSE_MEDIA_SEARCH: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {
      autoSearchConfig: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["name", "backgroundCheck"],
        properties: {
          name: {
            type: ["array", "null"],
            items: { type: "number" },
          },
          backgroundCheck: { type: ["number", "null"] },
        },
      },
      replyOnlyFromProfile: {
        type: "boolean",
      },
    },
  },
} as const;

export type PetitionFieldOptions = {
  [K in keyof typeof SCHEMAS]: FromSchema<(typeof SCHEMAS)[K]>;
};

export const PETITION_FIELD_SERVICE = Symbol.for("PETITION_FIELD_SERVICE");

@injectable()
export class PetitionFieldService {
  defaultFieldProperties(
    type: PetitionFieldType,
    field?: PetitionField,
    petition?: Pick<TableTypes["petition"], "automatic_numbering_config">,
  ): Partial<CreatePetitionField> {
    // Always inherit optional
    const optional = field?.optional ?? false;

    const multiple = ["FILE_UPLOAD", "DOW_JONES_KYC", "FIELD_GROUP", "PROFILE_SEARCH"].includes(
      type,
    ) // these are always true
      ? true
      : ["CHECKBOX", "HEADING", "BACKGROUND_CHECK", "ADVERSE_MEDIA_SEARCH"].includes(type) // these are always false
        ? false
        : field?.type === "FILE_UPLOAD" // Inherit if not coming from a FILE_UPLOAD
          ? false
          : (field?.multiple ?? false);

    const alias = type === "HEADING" ? null : (field?.alias ?? null);

    const replyOnlyFromProfile = isNonNullish(field?.profile_type_field_id)
      ? !!field.options.replyOnlyFromProfile
      : undefined;

    const options = ((): any => {
      switch (type) {
        case "HEADING": {
          return {
            hasPageBreak: false,
            showNumbering: isNonNullish(petition?.automatic_numbering_config),
          };
        }
        case "TEXT": {
          return {
            replyOnlyFromProfile,
            placeholder:
              isNonNullish(field) && this.hasPlaceholder(field.type)
                ? (field.options.placeholder ?? null)
                : null,
            maxLength:
              isNonNullish(field) &&
              ["TEXT", "SHORT_TEXT"].includes(field.type) &&
              isNonNullish(field.options.maxLength)
                ? field.options.maxLength
                : null,
          };
        }
        case "SHORT_TEXT": {
          return {
            replyOnlyFromProfile,
            placeholder:
              isNonNullish(field) && this.hasPlaceholder(field.type)
                ? (field.options.placeholder ?? null)
                : null,
            maxLength:
              isNonNullish(field) &&
              ["TEXT", "SHORT_TEXT"].includes(field.type) &&
              isNonNullish(field.options.maxLength)
                ? field.options.maxLength
                : null,
            format: null,
          };
        }
        case "BACKGROUND_CHECK": {
          return {
            replyOnlyFromProfile,
            integrationId: null,
            autoSearchConfig: null,
          };
        }
        case "DOW_JONES_KYC":
        case "DATE_TIME":
          return {};
        case "DATE": {
          return {
            replyOnlyFromProfile,
          };
        }
        case "NUMBER": {
          return {
            replyOnlyFromProfile,
            placeholder:
              isNonNullish(field) && this.hasPlaceholder(field.type)
                ? (field.options.placeholder ?? null)
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
            replyOnlyFromProfile,
            placeholder:
              isNonNullish(field) && this.hasPlaceholder(field.type)
                ? (field.options.placeholder ?? null)
                : null,
          };
        }
        case "SELECT": {
          return {
            replyOnlyFromProfile,
            values:
              isNonNullish(field) && ["SELECT", "CHECKBOX"].includes(field.type)
                ? field.options.values
                : [],
            placeholder:
              isNonNullish(field) && this.hasPlaceholder(field.type)
                ? (field.options.placeholder ?? null)
                : null,
          };
        }
        case "FILE_UPLOAD":
          return {
            replyOnlyFromProfile,
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
            replyOnlyFromProfile,
            values:
              isNonNullish(field) && ["SELECT", "CHECKBOX"].includes(field.type)
                ? field.options.values
                : [],
            limit: {
              type: "RADIO",
              min: (optional ?? false) ? 0 : 1,
              max: 1,
            },
          };
        }
        case "FIELD_GROUP": {
          return {
            groupName: null,
          };
        }
        case "ID_VERIFICATION": {
          return {
            attachToPdf: false,
            integrationId: null,
            config: {
              type: "SIMPLE",
              allowedDocuments: ["ID_CARD", "PASSPORT", "RESIDENCE_PERMIT", "DRIVER_LICENSE"],
            },
          };
        }
        case "PROFILE_SEARCH": {
          return {
            // will be filled later
            searchIn: [],
          };
        }
        case "ADVERSE_MEDIA_SEARCH": {
          return {
            autoSearchConfig: null,
          };
        }
        default:
          throw new Error();
      }
    })();

    return {
      optional,
      multiple,
      is_internal: [
        "DOW_JONES",
        "BACKGROUND_CHECK",
        "PROFILE_SEARCH",
        "ADVERSE_MEDIA_SEARCH",
      ].includes(type)
        ? true
        : (field?.is_internal ?? false),
      show_in_pdf: [
        "DOW_JONES",
        "BACKGROUND_CHECK",
        "PROFILE_SEARCH",
        "ADVERSE_MEDIA_SEARCH",
      ].includes(type)
        ? false
        : (field?.show_in_pdf ?? true),
      alias,
      has_comments_enabled: type === "HEADING" ? false : true,
      require_approval:
        ["HEADING", "FIELD_GROUP"].includes(type) || field?.is_internal
          ? false
          : (field?.require_approval ?? true),
      options,
    };
  }

  async mapFieldOptions(
    field: Pick<PetitionField, "type" | "options" | "profile_type_field_id">,
    locale?: ContactLocale,
  ) {
    const replyOnlyFromProfile = isNonNullish(field.profile_type_field_id)
      ? !!field.options.replyOnlyFromProfile
      : undefined;

    switch (field.type) {
      case "SHORT_TEXT":
      case "TEXT":
      case "NUMBER":
      case "DATE":
      case "PHONE":
      case "FILE_UPLOAD":
        return {
          ...field.options,
          replyOnlyFromProfile,
        };
      case "SELECT":
      case "CHECKBOX":
        return {
          ...field.options,
          replyOnlyFromProfile,
          ...(await this.loadSelectOptionsValuesAndLabels(field.options, locale)),
        };
      case "BACKGROUND_CHECK":
        return {
          ...field.options,
          replyOnlyFromProfile,
          ...(field.options.autoSearchConfig
            ? {
                autoSearchConfig: {
                  type: field.options.autoSearchConfig.type,
                  name: field.options.autoSearchConfig.name.map((id: number) =>
                    toGlobalId("PetitionField", id),
                  ),
                  date: isNonNullish(field.options.autoSearchConfig.date)
                    ? toGlobalId("PetitionField", field.options.autoSearchConfig.date)
                    : null,
                  country: isNonNullish(field.options.autoSearchConfig.country)
                    ? toGlobalId("PetitionField", field.options.autoSearchConfig.country)
                    : null,
                },
              }
            : {}),
        };
      case "ID_VERIFICATION":
        return {
          config: field.options.config,
          attachToPdf: field.options.attachToPdf,
        };
      case "PROFILE_SEARCH":
        return {
          searchIn: (field.options as PetitionFieldOptions["PROFILE_SEARCH"]).searchIn.map((s) => ({
            profileTypeId: toGlobalId("ProfileType", s.profileTypeId),
            profileTypeFieldIds: s.profileTypeFieldIds.map((id) =>
              toGlobalId("ProfileTypeField", id),
            ),
          })),
        };
      case "ADVERSE_MEDIA_SEARCH":
        return {
          autoSearchConfig: field.options.autoSearchConfig
            ? {
                name:
                  field.options.autoSearchConfig.name?.map((id: number) =>
                    toGlobalId("PetitionField", id),
                  ) ?? null,
                backgroundCheck: isNonNullish(field.options.autoSearchConfig.backgroundCheck)
                  ? toGlobalId("PetitionField", field.options.autoSearchConfig.backgroundCheck)
                  : null,
              }
            : null,
          replyOnlyFromProfile,
        };

      default:
        return field.options;
    }
  }

  async loadSelectOptionsValuesAndLabels(
    options: PetitionFieldOptions["SELECT" | "CHECKBOX"],
    locale: ContactLocale = "en",
  ) {
    if (isNonNullish(options.standardList)) {
      return this.standardListsLoader.load({ name: options.standardList, locale });
    }

    return pick(options, ["values", "labels"]);
  }

  mapReplyContentToDatabase(type: PetitionFieldType, content: any) {
    return type === "DATE_TIME"
      ? {
          ...content,
          value: fromZonedTime(content.datetime, content.timezone).toISOString(),
        }
      : type === "PROFILE_SEARCH"
        ? {
            ...omit(content, ["profileIds"]),
            value: content.profileIds.map((id: string) => fromGlobalId(id, "Profile").id),
          }
        : content;
  }

  private readonly standardListsLoader = new DataLoader<
    { name: (typeof STANDARD_LIST_NAMES)[number]; locale: ContactLocale },
    { values: string[]; labels?: Maybe<string[]> }
  >(
    async (keys) =>
      await pMap(
        keys,
        async ({ name: standardList, locale }) => {
          switch (standardList) {
            case "COUNTRIES": {
              const countries = (
                await import(join(__dirname, `../../data/countries/countries_${locale}.json`))
              ).default;
              const countryCodes = Object.keys(countries);
              return {
                values: countryCodes,
                labels: countryCodes.map((code) => countries[code]),
              };
            }
            case "EU_COUNTRIES": {
              const countries = (
                await import(join(__dirname, `../../data/countries/countries_${locale}.json`))
              ).default;
              const countryCodes = Object.keys(countries).filter((c) => EU_COUNTRIES.includes(c));
              return {
                values: countryCodes,
                labels: countryCodes.map((code) => countries[code]),
              };
            }
            case "NON_EU_COUNTRIES": {
              const countries = (
                await import(join(__dirname, `../../data/countries/countries_${locale}.json`))
              ).default;
              const countryCodes = Object.keys(countries).filter((c) => !EU_COUNTRIES.includes(c));
              return {
                values: countryCodes,
                labels: countryCodes.map((code) => countries[code]),
              };
            }
            case "CURRENCIES": {
              const currencies = (
                await import(join(__dirname, `../../data/currencies/currencies_${locale}.json`))
              ).default;
              const currenciesCodes = Object.keys(currencies);
              return {
                values: currenciesCodes,
                labels: currenciesCodes.map((code) =>
                  currencies[code].filter(isNonNullish).join(" - "),
                ),
              };
            }
            case "NACE": {
              const codes = (await import(join(__dirname, `../../data/nace/nace_en.json`))).default;
              const keys = Object.keys(codes).sort((a, b) => a.localeCompare(b));
              return {
                values: keys,
                labels: keys.map((code) => `${code} - ${codes[code]}`),
              };
            }
            case "CNAE": {
              const codes = (
                await import(
                  join(__dirname, `../../data/cnae/cnae_${locale === "en" ? "en" : "es"}.json`)
                )
              ).default;
              const keys = Object.keys(codes).sort((a, b) => a.localeCompare(b));
              return {
                values: keys,
                labels: keys.map((code) => `${code} - ${codes[code]}`),
              };
            }
            case "SIC": {
              const codes = (await import(join(__dirname, `../../data/sic/sic_en.json`))).default;
              const keys = Object.keys(codes).sort((a, b) => a.localeCompare(b));
              return {
                values: keys,
                labels: keys.map((code) => `${code} - ${codes[code]}`),
              };
            }
            default:
              throw new Error(`Unknown standard list: ${standardList}`);
          }
        },
        { concurrency: 1 },
      ),
  );

  private hasPlaceholder(type: PetitionFieldType) {
    return ["TEXT", "SHORT_TEXT", "SELECT", "NUMBER", "PHONE"].includes(type);
  }
}
