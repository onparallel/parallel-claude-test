import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { FromSchema } from "json-schema-to-ts";
import pMap from "p-map";
import { join } from "path";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import {
  ContactLocale,
  CreatePetitionField,
  PetitionFieldType,
  ProfileTypeField,
  ProfileTypeFieldType,
  UserLocale,
  UserLocaleValues,
} from "../db/__types";
import { LOCALIZABLE_USER_TEXT_SCHEMA } from "../graphql";
import { walkObject } from "../util/walkObject";
import { PETITION_FIELD_SERVICE, PetitionFieldService } from "./PetitionFieldService";

const EU_COUNTRIES =
  "AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE".split(",");

const SEARCH_FREQUENCY = [
  "5_YEARS",
  "3_YEARS",
  "2_YEARS",
  "1_YEARS",
  "9_MONTHS",
  "6_MONTHS",
  "3_MONTHS",
  "1_MONTHS",
  "1_DAYS",
] as const;

const STANDARD_LIST_NAMES = [
  "COUNTRIES",
  "EU_COUNTRIES",
  "NON_EU_COUNTRIES",
  "CURRENCIES",
  "CNAE", // deprecated
  "CNAE_2009",
  "CNAE_2025",
  "NACE",
  "SIC",
] as const;

const FIELD_MONITORING_SCHEMA = {
  type: ["object", "null"],
  required: ["searchFrequency"],
  additionalProperties: false,
  properties: {
    activationCondition: {
      type: ["object", "null"],
      required: ["profileTypeFieldId", "values"],
      properties: {
        profileTypeFieldId: { type: "number" },
        values: {
          type: "array",
          minItems: 1,
          items: {
            type: "string",
          },
        },
      },
    },
    searchFrequency: {
      type: "object",
      oneOf: [
        {
          type: "object",
          required: ["type", "frequency"],
          additionalProperties: false,
          properties: {
            type: { type: "string", const: "FIXED" },
            frequency: {
              type: "string",
              enum: SEARCH_FREQUENCY,
            },
          },
        },
        {
          type: "object",
          required: ["type", "profileTypeFieldId", "options"],
          additionalProperties: false,
          properties: {
            type: { type: "string", const: "VARIABLE" },
            profileTypeFieldId: { type: "number" },
            options: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["frequency", "value"],
                additionalProperties: false,
                properties: {
                  frequency: { type: "string", enum: SEARCH_FREQUENCY },
                  value: { type: "string" },
                },
              },
            },
          },
        },
      ],
    },
  },
} as const;

export const SCHEMAS = {
  TEXT: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  SHORT_TEXT: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {
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
  FILE: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  DATE: {
    type: "object",
    required: ["useReplyAsExpiryDate"],
    additionalProperties: false,
    properties: {
      useReplyAsExpiryDate: { type: "boolean" },
    },
  },
  PHONE: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  NUMBER: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {},
  },
  SELECT: {
    type: "object",
    required: ["values"],
    additionalProperties: false,
    properties: {
      values: {
        type: "array",
        maxItems: 1000,
        items: {
          type: "object",
          required: ["label", "value"],
          properties: {
            label: LOCALIZABLE_USER_TEXT_SCHEMA,
            value: { type: "string", maxLength: 50 },
            color: { type: "string" },
            isStandard: { type: "boolean" },
          },
        },
      },
      showOptionsWithColors: { type: ["boolean", "null"] },
      standardList: {
        type: ["string", "null"],
        enum: [...STANDARD_LIST_NAMES, null],
      },
    },
  },
  CHECKBOX: {
    type: "object",
    required: ["values"],
    additionalProperties: false,
    properties: {
      values: {
        type: "array",
        maxItems: 1000,
        items: {
          type: "object",
          required: ["label", "value"],
          properties: {
            label: LOCALIZABLE_USER_TEXT_SCHEMA,
            value: { type: "string", maxLength: 50 },
            isStandard: { type: "boolean" },
          },
        },
      },
      standardList: {
        type: ["string", "null"],
        enum: [...STANDARD_LIST_NAMES, null],
      },
    },
  },
  BACKGROUND_CHECK: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {
      monitoring: FIELD_MONITORING_SCHEMA,
    },
  },
  ADVERSE_MEDIA_SEARCH: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {
      monitoring: FIELD_MONITORING_SCHEMA,
    },
  },
} as const;

export type ProfileTypeFieldOptions = {
  [K in keyof typeof SCHEMAS]: FromSchema<(typeof SCHEMAS)[K]>;
};

export type ProfileTypeFieldMonitoring = NonNullable<FromSchema<typeof FIELD_MONITORING_SCHEMA>>;

export const PROFILE_TYPE_FIELD_SERVICE = Symbol.for("PROFILE_TYPE_FIELD_SERVICE");

@injectable()
export class ProfileTypeFieldService {
  constructor(@inject(PETITION_FIELD_SERVICE) private petitionFields: PetitionFieldService) {}

  defaultProfileTypeFieldOptions(type: ProfileTypeFieldType): any {
    if (type === "DATE") {
      return { useReplyAsExpiryDate: false };
    } else if (type === "SELECT" || type === "CHECKBOX") {
      return {
        values: [],
      };
    }
    return {};
  }

  async mapProfileTypeFieldOptions(
    type: ProfileTypeFieldType,
    options: any,
    globalIdMap: (type: string, id: any) => any,
  ) {
    const _options =
      type === "SELECT" || type === "CHECKBOX"
        ? {
            ...options,
            values: await this.loadProfileTypeFieldSelectValues(options),
          }
        : options;

    // create a copy of options object to not alter data by reference
    // Create a deep copy of the options object and transform profileTypeFieldId values
    const result = structuredClone(_options);
    // Walk through the object and transform profileTypeFieldId values
    walkObject(result, (key, value, node) => {
      if (key === "profileTypeFieldId" && value !== undefined) {
        // Replace the value in-place with the mapped ID
        node[key] = globalIdMap("ProfileTypeField", value);
      }
    });

    return result;
  }

  async loadProfileTypeFieldSelectValues(
    key: Pick<ProfileTypeFieldOptions["SELECT" | "CHECKBOX"], "standardList" | "values">,
  ) {
    if (isNonNullish(key.standardList)) {
      return this.standardListsLoader.load(key.standardList);
    } else {
      return key.values;
    }
  }

  mapValueContentToDatabase(type: ProfileTypeFieldType, content: any) {
    switch (type) {
      case "PHONE":
        assert(typeof content.value === "string", "Expected value to be a string");
        return {
          value: content.value.replace(/[^\d+]/g, ""), // remove all non-digits or +
          // pretty value is calculated in gql resolver and not required to be stored
        };

      default:
        return content;
    }
  }

  mapToPetitionField(
    profileTypeField: ProfileTypeField,
    defaultLocale: ContactLocale,
  ): Omit<CreatePetitionField, "petition_id" | "position" | "parent_petition_field_id"> {
    const FIELD_TYPE_MAP: Record<ProfileTypeFieldType, PetitionFieldType> = {
      TEXT: "TEXT",
      SHORT_TEXT: "SHORT_TEXT",
      SELECT: "SELECT",
      PHONE: "PHONE",
      NUMBER: "NUMBER",
      FILE: "FILE_UPLOAD",
      DATE: "DATE",
      BACKGROUND_CHECK: "BACKGROUND_CHECK",
      CHECKBOX: "CHECKBOX",
      ADVERSE_MEDIA_SEARCH: "ADVERSE_MEDIA_SEARCH",
    };
    const type = FIELD_TYPE_MAP[profileTypeField.type];

    const defaultProperties = this.petitionFields.defaultFieldProperties(type);

    switch (profileTypeField.type) {
      case "SHORT_TEXT": {
        defaultProperties.options.format = profileTypeField.options.format ?? null;
        break;
      }
      case "SELECT": {
        const options = profileTypeField.options as ProfileTypeFieldOptions["SELECT"];
        defaultProperties.options.standardList = options.standardList ?? null;
        defaultProperties.options.values = isNonNullish(options.standardList)
          ? []
          : options.values.map((v) => v.value);
        defaultProperties.options.labels = isNonNullish(options.standardList)
          ? []
          : options.values.map(
              (v) => (v.label as any)[defaultLocale] ?? v.label["en"] ?? v.label["es"] ?? null,
            );
        break;
      }
      case "CHECKBOX": {
        const options = profileTypeField.options as ProfileTypeFieldOptions["CHECKBOX"];
        defaultProperties.options.standardList = options.standardList ?? null;
        defaultProperties.options.values = isNonNullish(options.standardList)
          ? []
          : options.values.map((v) => v.value);
        defaultProperties.options.labels = isNonNullish(options.standardList)
          ? []
          : options.values.map(
              (v) => (v.label as any)[defaultLocale] ?? v.label["en"] ?? v.label["es"] ?? null,
            );
        defaultProperties.options.limit = {
          min: 1,
          max: 1,
          type: "UNLIMITED",
        };
        break;
      }
      default:
        break;
    }

    return {
      profile_type_field_id: profileTypeField.id,
      type,
      title:
        profileTypeField.name[defaultLocale] ??
        profileTypeField.name["en"] ??
        profileTypeField.name["es"] ??
        null,
      ...defaultProperties,
    };
  }

  private readonly standardListsLoader = new DataLoader<
    (typeof STANDARD_LIST_NAMES)[number],
    ProfileTypeFieldOptions["SELECT" | "CHECKBOX"]["values"]
  >(
    async (keys) =>
      await pMap(
        keys,
        async (standardList) => {
          switch (standardList) {
            case "COUNTRIES": {
              const countriesByLocale = Object.fromEntries(
                await pMap(UserLocaleValues, async (locale) => [
                  locale,
                  (await import(join(__dirname, `../../data/countries/countries_${locale}.json`)))
                    .default,
                ]),
              );

              const countryCodes = Object.keys(countriesByLocale["en"]);

              return countryCodes.map((code) => ({
                value: code,
                label: Object.fromEntries(
                  UserLocaleValues.map((locale) => [locale, countriesByLocale[locale][code]]),
                ) as Record<UserLocale, string>,
                isStandard: true,
              }));
            }
            case "EU_COUNTRIES": {
              const countriesByLocale = Object.fromEntries(
                await pMap(UserLocaleValues, async (locale) => [
                  locale,
                  (await import(join(__dirname, `../../data/countries/countries_${locale}.json`)))
                    .default,
                ]),
              );

              const countryCodes = Object.keys(countriesByLocale["en"]).filter((c) =>
                EU_COUNTRIES.includes(c),
              );

              return countryCodes.map((code) => ({
                value: code,
                label: Object.fromEntries(
                  UserLocaleValues.map((locale) => [locale, countriesByLocale[locale][code]]),
                ) as Record<UserLocale, string>,
                isStandard: true,
              }));
            }
            case "NON_EU_COUNTRIES": {
              const countriesByLocale = Object.fromEntries(
                await pMap(UserLocaleValues, async (locale) => [
                  locale,
                  (await import(join(__dirname, `../../data/countries/countries_${locale}.json`)))
                    .default,
                ]),
              );

              const countryCodes = Object.keys(countriesByLocale["en"]).filter(
                (c) => !EU_COUNTRIES.includes(c),
              );

              return countryCodes.map((code) => ({
                value: code,
                label: Object.fromEntries(
                  UserLocaleValues.map((locale) => [locale, countriesByLocale[locale][code]]),
                ) as Record<UserLocale, string>,
                isStandard: true,
              }));
            }
            case "CURRENCIES": {
              const currenciesByUserLocale = Object.fromEntries(
                await pMap(UserLocaleValues, async (locale) => [
                  locale,
                  (await import(join(__dirname, `../../data/currencies/currencies_${locale}.json`)))
                    .default,
                ]),
              );

              const currencyCodes = Object.keys(currenciesByUserLocale["en"]);

              return currencyCodes.map((code) => ({
                value: code,
                label: Object.fromEntries(
                  UserLocaleValues.map((locale) => {
                    const label =
                      currenciesByUserLocale[locale][
                        code as keyof (typeof currenciesByUserLocale)["en"]
                      ] ?? currenciesByUserLocale["en"][code]; // VED currency is missing in es, ca, it, pt. fallback to en for this case

                    return [locale, label.filter(isNonNullish).join(" - ")];
                  }),
                ) as Record<UserLocale, string>,
                isStandard: true,
              }));
            }
            case "CNAE":
            case "CNAE_2009": {
              const locales = ["es", "en"] as const;
              const cnaeByLocale = Object.fromEntries(
                await pMap(locales, async (locale) => [
                  locale,
                  (await import(join(__dirname, `../../data/cnae/cnae_2009_${locale}.json`)))
                    .default,
                ]),
              );

              const codes = Object.keys(cnaeByLocale["en"]).sort((a, b) => a.localeCompare(b));

              return codes.map((code) => ({
                value: code,
                label: Object.fromEntries(
                  locales.map((locale) => [locale, `${code} - ${cnaeByLocale[locale][code]}`]),
                ) as Record<UserLocale, string>,
                isStandard: true,
              }));
            }
            case "CNAE_2025": {
              const locales = ["es", "en"] as const;
              const cnaeByLocale = Object.fromEntries(
                await pMap(locales, async (locale) => [
                  locale,
                  (await import(join(__dirname, `../../data/cnae/cnae_2025_${locale}.json`)))
                    .default,
                ]),
              );

              const codes = Object.keys(cnaeByLocale["en"]).sort((a, b) => a.localeCompare(b));

              return codes.map((code) => ({
                value: code,
                label: Object.fromEntries(
                  locales.map((locale) => [locale, `${code} - ${cnaeByLocale[locale][code]}`]),
                ) as Record<UserLocale, string>,
                isStandard: true,
              }));
            }
            case "NACE": {
              const nace = (await import(join(__dirname, `../../data/nace/nace_en.json`))).default;
              return Object.keys(nace)
                .sort((a, b) => a.localeCompare(b))
                .map((code) => ({
                  value: code,
                  label: { en: `${code} - ${nace[code]}` } as Record<UserLocale, string>,
                  isStandard: true,
                }));
            }
            case "SIC": {
              const nace = (await import(join(__dirname, `../../data/sic/sic_en.json`))).default;
              return Object.keys(nace)
                .sort((a, b) => a.localeCompare(b))
                .map((code) => ({
                  value: code,
                  label: { en: `${code} - ${nace[code]}` } as Record<UserLocale, string>,
                  isStandard: true,
                }));
            }
            default:
              throw new Error(`Unknown standard list: ${standardList}`);
          }
        },
        { concurrency: 1 },
      ),
  );
}
