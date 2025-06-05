import DataLoader from "dataloader";
import { fromZonedTime } from "date-fns-tz";
import { injectable } from "inversify";
import { FromSchema } from "json-schema-to-ts";
import pMap from "p-map";
import { join } from "path";
import { isNonNullish, omit } from "remeda";
import {
  ContactLocale,
  CreatePetitionField,
  DocumentProcessingTypeValues,
  PetitionField,
  PetitionFieldType,
  TableTypes,
} from "../db/__types";
import { fromGlobalId } from "../util/globalId";
import { never } from "../util/never";

const EU_COUNTRIES =
  "AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE".split(",");

const STANDARD_LIST_NAMES = [
  "COUNTRIES",
  "EU_COUNTRIES",
  "NON_EU_COUNTRIES",
  "CURRENCIES",
  "NACE",
  "CNAE", // deprecated
  "CNAE_2009",
  "CNAE_2025",
  "SIC",
] as const;

export const SCHEMAS = {
  NUMBER: {
    type: "object",
    additionalProperties: false,
    properties: {
      placeholder: { type: ["string", "null"] },
      range: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          min: { type: ["number", "null"] },
          max: { type: ["number", "null"] },
        },
      },
      decimals: { type: ["number", "null"] },
      prefix: { type: ["string", "null"] },
      suffix: { type: ["string", "null"] },
      replyOnlyFromProfile: { type: ["boolean", "null"] },
    },
  },
  DATE: {
    type: "object",
    additionalProperties: false,
    properties: {
      replyOnlyFromProfile: { type: ["boolean", "null"] },
    },
  },
  DATE_TIME: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  PHONE: {
    type: "object",
    additionalProperties: false,
    properties: {
      placeholder: { type: ["string", "null"] },
      replyOnlyFromProfile: { type: ["boolean", "null"] },
    },
  },
  TEXT: {
    type: "object",
    additionalProperties: false,
    properties: {
      placeholder: { type: ["string", "null"] },
      maxLength: { type: ["integer", "null"] },
      replyOnlyFromProfile: { type: ["boolean", "null"] },
    },
  },
  SHORT_TEXT: {
    type: "object",
    additionalProperties: false,
    properties: {
      placeholder: { type: ["string", "null"] },
      maxLength: { type: ["integer", "null"] },
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
      replyOnlyFromProfile: { type: ["boolean", "null"] },
    },
  },
  FILE_UPLOAD: {
    type: "object",
    additionalProperties: false,
    properties: {
      maxFileSize: { type: ["number", "null"] },
      accepts: {
        type: ["array", "null"],
        items: {
          type: "string",
          enum: ["PDF", "IMAGE"],
        },
      },
      documentProcessing: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["processDocumentAs"],
        properties: {
          processDocumentAs: {
            type: "string",
            enum: DocumentProcessingTypeValues,
          },
        },
      },
      processDocument: {
        description: "Whether to enable AI document processing for this field",
        type: ["boolean", "null"],
      },
      attachToPdf: {
        type: ["boolean", "null"],
      },
      replyOnlyFromProfile: { type: ["boolean", "null"] },
    },
  },
  HEADING: {
    type: "object",
    additionalProperties: false,
    properties: {
      hasPageBreak: { type: ["boolean", "null"] },
      showNumbering: { type: ["boolean", "null"] },
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
      placeholder: { type: ["string", "null"] },
      standardList: {
        type: ["string", "null"],
        enum: [...STANDARD_LIST_NAMES, null],
      },
      replyOnlyFromProfile: { type: ["boolean", "null"] },
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
            items: { type: "string" },
          },
          file: {
            type: ["object", "null"],
            additionalProperties: false,
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
        type: ["object", "null"],
        additionalProperties: false,
        required: ["type", "min", "max"],
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
      replyOnlyFromProfile: { type: ["boolean", "null"] },
    },
  },
  ES_TAX_DOCUMENTS: {
    type: "object",
    additionalProperties: false,
    required: ["requests"],
    properties: {
      attachToPdf: { type: ["boolean", "null"] },
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
        type: ["object", "null"],
        additionalProperties: false,
        required: ["type"],
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
    properties: {
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
            type: "array",
            items: {
              type: "number",
            },
            minItems: 1,
          },
          date: { type: ["number", "null"] },
          country: { type: ["number", "null"] },
        },
      },
      replyOnlyFromProfile: { type: ["boolean", "null"] },
      integrationId: { type: ["number", "null"] },
    },
  },
  FIELD_GROUP: {
    type: "object",
    additionalProperties: false,
    properties: {
      groupName: {
        type: ["string", "null"],
      },
    },
  },
  ID_VERIFICATION: {
    type: "object",
    additionalProperties: false,
    required: ["config"],
    properties: {
      attachToPdf: { type: ["boolean", "null"] },
      config: {
        type: "object",
        additionalProperties: false,
        required: ["type", "allowedDocuments"],
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
      replyOnlyFromProfile: { type: ["boolean", "null"] },
      integrationId: { type: ["number", "null"] },
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
            placeholder: field?.options.placeholder ?? null,
            maxLength: field?.options.maxLength ?? null,
          };
        }
        case "SHORT_TEXT": {
          return {
            replyOnlyFromProfile,
            placeholder: field?.options.placeholder ?? null,
            maxLength: field?.options.maxLength ?? null,
            format: field?.options.format ?? null,
          };
        }
        case "BACKGROUND_CHECK":
        case "ADVERSE_MEDIA_SEARCH": {
          return {
            replyOnlyFromProfile,
            autoSearchConfig: field?.options.autoSearchConfig ?? null,
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
            placeholder: field?.options.placeholder ?? null,
            range: field?.options.range ?? {
              min: 0,
            },
            decimals: field?.options.decimals ?? 2,
            prefix: field?.options.prefix ?? null,
            suffix: field?.options.suffix ?? null,
          };
        }
        case "PHONE": {
          return {
            replyOnlyFromProfile,
            placeholder: field?.options.placeholder ?? null,
          };
        }
        case "SELECT": {
          return {
            replyOnlyFromProfile,
            values: field?.options.values ?? [],
            placeholder: field?.options.placeholder ?? null,
            standardList: field?.options.standardList ?? null,
          };
        }
        case "FILE_UPLOAD":
          return {
            replyOnlyFromProfile,
            accepts: field?.options.accepts ?? null,
            attachToPdf: field?.options.attachToPdf ?? false,
            processDocument: field?.options.processDocument ?? false,
            /** @deprecated use processDocument */
            documentProcessing: field?.options.documentProcessing ?? null,
          };
        case "ES_TAX_DOCUMENTS":
          return {
            attachToPdf: field?.options.attachToPdf ?? false,
            requests: field?.options.requests ?? [
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
            values: field?.options.values ?? [],
            limit: {
              type: "RADIO",
              min: (optional ?? false) ? 0 : 1,
              max: 1,
            },
          };
        }
        case "FIELD_GROUP": {
          return {
            groupName: field?.options.groupName ?? null,
          };
        }
        case "ID_VERIFICATION": {
          return {
            attachToPdf: field?.options.attachToPdf ?? false,
            config: {
              type: field?.options.config.type ?? "SIMPLE",
              allowedDocuments: field?.options.config.allowedDocuments ?? [
                "ID_CARD",
                "PASSPORT",
                "RESIDENCE_PERMIT",
                "DRIVER_LICENSE",
              ],
            },
          };
        }
        case "PROFILE_SEARCH": {
          return {
            // will be filled later
            searchIn: [],
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

  /**
   * Maps a field's options to a complete options object based on its type.
   * This method handles both complete and incomplete options values, ensuring
   * all required properties are present in the returned object.
   *
   * @param field - The field containing type and options to map
   * @param idMapFn - Optional function to map IDs to global IDs or other formats
   * @param locale - Optional locale for localized options
   * @returns A complete options object matching the field's type
   */
  async mapFieldOptions(
    field: Pick<PetitionField, "type" | "options">,
    idMapFn: (type: string, id: number) => string | number,
    locale?: ContactLocale,
  ) {
    switch (field.type) {
      case "HEADING": {
        return {
          hasPageBreak: field.options.hasPageBreak ?? false,
          showNumbering: field.options.showNumbering ?? false,
        };
      }
      case "TEXT":
        return {
          placeholder: field.options.placeholder ?? null,
          maxLength: field.options.maxLength ?? null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "SHORT_TEXT":
        return {
          placeholder: field.options.placeholder ?? null,
          maxLength: field.options.maxLength ?? null,
          format: field.options.format ?? null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "NUMBER":
        return {
          placeholder: field.options.placeholder ?? null,
          range: field.options.range ?? null,
          decimals: field.options.decimals ?? null,
          prefix: field.options.prefix ?? null,
          suffix: field.options.suffix ?? null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "DATE":
        return {
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "DATE_TIME":
        return {};
      case "PHONE":
        return {
          placeholder: field.options.placeholder ?? null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "SELECT":
        const options = field.options as PetitionFieldOptions["SELECT"];
        return {
          ...(await this.loadSelectOptionsValuesAndLabels(options, locale)),
          placeholder: field.options.placeholder ?? null,
          standardList: field.options.standardList ?? null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "CHECKBOX":
        return {
          ...(await this.loadSelectOptionsValuesAndLabels(field.options, locale)),
          limit: field.options.limit ?? null,
          standardList: field.options.standardList ?? null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "FILE_UPLOAD":
        return {
          accepts: field.options.accepts ?? null,
          attachToPdf: field.options.attachToPdf ?? false,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
          processDocument: field.options.processDocument ?? false,
          /** @deprecated use processDocument */
          documentProcessing: field.options.documentProcessing ?? null,
        };
      case "DYNAMIC_SELECT":
        return {
          file: field.options.file ?? null,
          values: field.options.values ?? [],
          labels: field.options.labels ?? [],
        };
      case "FIELD_GROUP":
        return {
          groupName: field.options.groupName ?? null,
        };
      case "DOW_JONES_KYC":
        return {};
      case "ES_TAX_DOCUMENTS":
        return {
          attachToPdf: field.options.attachToPdf ?? false,
          requests: field.options.requests,
        };
      case "BACKGROUND_CHECK":
        return {
          autoSearchConfig: field.options.autoSearchConfig
            ? {
                type: field.options.autoSearchConfig.type ?? null,
                name:
                  field.options.autoSearchConfig.name?.map((id: number) =>
                    idMapFn("PetitionField", id),
                  ) ?? [],
                date: isNonNullish(field.options.autoSearchConfig.date)
                  ? idMapFn("PetitionField", field.options.autoSearchConfig.date)
                  : null,
                country: isNonNullish(field.options.autoSearchConfig.country)
                  ? idMapFn("PetitionField", field.options.autoSearchConfig.country)
                  : null,
              }
            : null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      case "ID_VERIFICATION":
        return {
          config: field.options.config,
          attachToPdf: field.options.attachToPdf ?? false,
        };
      case "PROFILE_SEARCH":
        return {
          searchIn: (field.options as PetitionFieldOptions["PROFILE_SEARCH"]).searchIn.map((s) => ({
            profileTypeId: idMapFn("ProfileType", s.profileTypeId),
            profileTypeFieldIds: s.profileTypeFieldIds.map((id) => idMapFn("ProfileTypeField", id)),
          })),
        };
      case "ADVERSE_MEDIA_SEARCH":
        return {
          autoSearchConfig: field.options.autoSearchConfig
            ? {
                name:
                  field.options.autoSearchConfig.name?.map((id: number) =>
                    idMapFn("PetitionField", id),
                  ) ?? null,
                backgroundCheck: isNonNullish(field.options.autoSearchConfig.backgroundCheck)
                  ? idMapFn("PetitionField", field.options.autoSearchConfig.backgroundCheck)
                  : null,
              }
            : null,
          replyOnlyFromProfile: field.options.replyOnlyFromProfile ?? false,
        };
      default:
        never(`Unknown field type: ${field.type}`);
    }
  }

  async loadSelectOptionsValuesAndLabels(
    options: PetitionFieldOptions["SELECT" | "CHECKBOX"],
    locale: ContactLocale = "en",
  ) {
    if (isNonNullish(options.standardList)) {
      return this.standardListsLoader.load({ name: options.standardList, locale });
    }

    return {
      values: options.values ?? [],
      labels: options.labels ?? null,
    };
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
    { values: string[]; labels: string[] }
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
            case "CNAE":
            case "CNAE_2009": {
              const codes = (
                await import(
                  join(__dirname, `../../data/cnae/cnae_2009_${locale === "en" ? "en" : "es"}.json`)
                )
              ).default;
              const keys = Object.keys(codes).sort((a, b) => a.localeCompare(b));
              return {
                values: keys,
                labels: keys.map((code) => `${code} - ${codes[code]}`),
              };
            }
            case "CNAE_2025": {
              const codes = (
                await import(
                  join(__dirname, `../../data/cnae/cnae_2025_${locale === "en" ? "en" : "es"}.json`)
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
}
