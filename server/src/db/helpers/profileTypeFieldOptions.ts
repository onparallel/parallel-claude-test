import Ajv from "ajv";
import addFormats from "ajv-formats";
import { FromSchema } from "json-schema-to-ts";
import pMap from "p-map";
import { LOCALIZABLE_USER_TEXT_SCHEMA } from "../../graphql";
import { ProfileTypeFieldType, UserLocale, UserLocaleValues } from "../__types";

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
    properties: {},
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
      standardList: { type: ["string", "null"] },
    },
  },
} as const;

export type ProfileTypeFieldOptions = {
  [K in keyof typeof SCHEMAS]: FromSchema<(typeof SCHEMAS)[K]>;
};

export function validateProfileTypeFieldOptions(type: ProfileTypeFieldType, options: any) {
  const ajv = new Ajv();
  addFormats(ajv, ["date-time"]);

  const valid = ajv.validate(SCHEMAS[type], options);
  if (!valid) {
    throw new Error(ajv.errorsText());
  }
}

export function defaultProfileTypeFieldOptions(type: ProfileTypeFieldType) {
  if (type === "DATE") {
    return { useReplyAsExpiryDate: false };
  }
  return {};
}

export async function profileTypeFieldSelectValues(
  options: ProfileTypeFieldOptions["SELECT"],
): Promise<ProfileTypeFieldOptions["SELECT"]["values"]> {
  if (options.standardList === "COUNTRIES") {
    const countriesByUserLocale = Object.fromEntries(
      await pMap(UserLocaleValues, async (locale) => [
        locale,
        (await import(`./countries/countries_${locale}.json`)).default,
      ]),
    );

    const countryCodes = Object.keys(countriesByUserLocale["en"]);

    return countryCodes.map((code) => ({
      value: code,
      label: Object.fromEntries(
        UserLocaleValues.map((locale) => {
          const label =
            countriesByUserLocale[locale][code as keyof (typeof countriesByUserLocale)["en"]];
          return [locale, Array.isArray(label) ? label[0] : label];
        }),
      ) as Record<UserLocale, string>,
      isStandard: true,
    }));
  }

  return options.values;
}

export async function mapProfileTypeFieldOptions(type: ProfileTypeFieldType, options: any) {
  if (type === "SELECT") {
    return {
      ...options,
      values: await profileTypeFieldSelectValues(options),
    };
  }
  return options;
}
