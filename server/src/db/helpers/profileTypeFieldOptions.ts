import Ajv from "ajv";
import addFormats from "ajv-formats";
import { FromSchema } from "json-schema-to-ts";
import pMap from "p-map";
import { join } from "path";
import { difference, isNonNullish, unique } from "remeda";
import { LOCALIZABLE_USER_TEXT_SCHEMA } from "../../graphql/helpers/scalars/LocalizableUserText";
import { ProfileTypeField, ProfileTypeFieldType, UserLocale, UserLocaleValues } from "../__types";

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

const SCHEMAS = {
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
        enum: [
          "COUNTRIES",
          "EU_COUNTRIES",
          "NON_EU_COUNTRIES",
          "CURRENCIES",
          "CNAE",
          "NACE",
          "SIC",
          null,
        ],
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
        enum: [
          "COUNTRIES",
          "EU_COUNTRIES",
          "NON_EU_COUNTRIES",
          "CURRENCIES",
          "CNAE",
          "NACE",
          "SIC",
          null,
        ],
      },
    },
  },
  BACKGROUND_CHECK: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {
      monitoring: {
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
      },
    },
  },
} as const;

export type ProfileTypeFieldOptions = {
  [K in keyof typeof SCHEMAS]: FromSchema<(typeof SCHEMAS)[K]>;
};

export async function validateProfileTypeFieldOptions(
  type: ProfileTypeFieldType,
  options: any,
  ctx: {
    profileTypeId: number;
    loadProfileTypeField: (id: number) => Promise<ProfileTypeField | null>;
  },
) {
  const ajv = new Ajv();
  addFormats(ajv, ["date-time"]);

  const valid = ajv.validate(SCHEMAS[type], options);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }

  // make sure user has access to the referenced profileTypeFields in BACKGROUND_CHECK options
  if (type === "BACKGROUND_CHECK") {
    const opts = options as ProfileTypeFieldOptions["BACKGROUND_CHECK"];
    if (isNonNullish(opts.monitoring?.activationCondition?.profileTypeFieldId)) {
      const profileTypeField = await ctx.loadProfileTypeField(
        opts.monitoring.activationCondition.profileTypeFieldId,
      );
      if (
        !profileTypeField ||
        profileTypeField.type !== "SELECT" ||
        profileTypeField.profile_type_id !== ctx.profileTypeId
      ) {
        throw new Error("Invalid profileTypeFieldId");
      }

      // make sure every value in activation conditions is a valid option on SELECT field
      const selectValues = unique(
        (
          await profileTypeFieldSelectValues(
            profileTypeField.options as ProfileTypeFieldOptions["SELECT"],
          )
        ).map((v) => v.value),
      );
      if (
        !unique(opts.monitoring.activationCondition.values).every((activationValue) =>
          selectValues.includes(activationValue),
        )
      ) {
        throw new Error("Invalid activation values");
      }
    }

    if (opts.monitoring?.searchFrequency.type === "VARIABLE") {
      const profileTypeField = await ctx.loadProfileTypeField(
        opts.monitoring.searchFrequency.profileTypeFieldId,
      );
      if (
        !profileTypeField ||
        profileTypeField.type !== "SELECT" ||
        profileTypeField.profile_type_id !== ctx.profileTypeId
      ) {
        throw new Error("Invalid profileTypeFieldId");
      }

      // every SELECT value has to be set on variable searchFrequency options
      const selectValues = unique(
        (
          await profileTypeFieldSelectValues(
            profileTypeField.options as ProfileTypeFieldOptions["SELECT"],
          )
        ).map((v) => v.value),
      );
      const searchFrequencyValues = unique(
        opts.monitoring.searchFrequency.options.map((o) => o.value),
      );
      if (
        selectValues.length !== searchFrequencyValues.length ||
        difference(selectValues, searchFrequencyValues).length !== 0
      ) {
        throw new Error("Invalid variable searchFrequency options");
      }
    }
  }
}

export function defaultProfileTypeFieldOptions(type: ProfileTypeFieldType): any {
  if (type === "DATE") {
    return { useReplyAsExpiryDate: false };
  } else if (type === "SELECT" || type === "CHECKBOX") {
    return {
      values: [],
    };
  }
  return {};
}

const EU_COUNTRIES =
  "AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE".split(",");

export async function profileTypeFieldSelectValues(
  options: ProfileTypeFieldOptions["SELECT"],
): Promise<ProfileTypeFieldOptions["SELECT"]["values"]> {
  if (isNonNullish(options.standardList)) {
    switch (options.standardList) {
      case "COUNTRIES": {
        const countriesByLocale = Object.fromEntries(
          await pMap(UserLocaleValues, async (locale) => [
            locale,
            (await import(join(__dirname, `../../../data/countries/countries_${locale}.json`)))
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
            (await import(join(__dirname, `../../../data/countries/countries_${locale}.json`)))
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
            (await import(join(__dirname, `../../../data/countries/countries_${locale}.json`)))
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
            (await import(join(__dirname, `../../../data/currencies/currencies_${locale}.json`)))
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
      case "CNAE": {
        const locales = ["es", "en"] as const;
        const cnaeByLocale = Object.fromEntries(
          await pMap(locales, async (locale) => [
            locale,
            (await import(join(__dirname, `../../../data/cnae/cnae_${locale}.json`))).default,
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
        const nace = (await import(join(__dirname, `../../../data/nace/nace_en.json`))).default;
        return Object.keys(nace)
          .sort((a, b) => a.localeCompare(b))
          .map((code) => ({
            value: code,
            label: { en: `${code} - ${nace[code]}` } as Record<UserLocale, string>,
            isStandard: true,
          }));
      }
      case "SIC": {
        const nace = (await import(join(__dirname, `../../../data/sic/sic_en.json`))).default;
        return Object.keys(nace)
          .sort((a, b) => a.localeCompare(b))
          .map((code) => ({
            value: code,
            label: { en: `${code} - ${nace[code]}` } as Record<UserLocale, string>,
            isStandard: true,
          }));
      }
    }
  }

  return options.values;
}

export async function mapProfileTypeFieldOptions(
  type: ProfileTypeFieldType,
  options: any,
  globalIdMap: (type: string, id: any) => any,
) {
  const _options =
    type === "SELECT" || type === "CHECKBOX"
      ? {
          ...options,
          values: await profileTypeFieldSelectValues(options),
        }
      : options;
  // create a copy of options object to not alter data by reference
  return JSON.parse(JSON.stringify(_options), (key, value) => {
    if (key === "profileTypeFieldId") {
      return globalIdMap("ProfileTypeField", value);
    }

    return value;
  });
}

export function optionsIncludeProfileTypeFieldId(options: any, ids: number[]) {
  try {
    JSON.parse(JSON.stringify(options), (key, value) => {
      if (key === "profileTypeFieldId" && typeof value === "number" && ids.includes(value)) {
        throw new Error();
      }
    });
    return false;
  } catch {
    return true;
  }
}
