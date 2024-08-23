import { GraphQLScalarLiteralParser, GraphQLScalarTypeConfig, Kind } from "graphql";
import { scalarType } from "nexus";
import { isNonNullish } from "remeda";
import { UserLocale, UserLocaleValues } from "../../../db/__types";

export const LOCALIZABLE_USER_TEXT_SCHEMA = {
  type: "object",
  properties: { en: { type: "string" }, es: { type: "string" } },
  additionalProperties: false,
  anyOf: [{ required: ["en"] }, { required: ["es"] }],
} as const;

export type LocalizableUserText = { [locale in UserLocale]?: string };

function ensureLocalizableUserText(value: any, strict: boolean): LocalizableUserText {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Value is not a valid LocalizableUserText: ${value}`);
  }
  let valid = false;
  for (const locale of UserLocaleValues) {
    if (locale in value) {
      if (typeof value[locale] === "string") {
        valid = true;
      } else {
        throw new Error(
          `Value is not a valid LocalizableUserText: ${JSON.stringify(value)} $.${locale} is not a string`,
        );
      }
    }
  }
  if (!valid) {
    throw new Error(
      `Value is not a valid LocalizableUserText: ${JSON.stringify(value)} missing at least one locale key (${UserLocaleValues.join(", ")})`,
    );
  }
  if (strict) {
    const unknownKey = Object.keys(value).find(
      (key) => !(UserLocaleValues as string[]).includes(key),
    );
    if (isNonNullish(unknownKey)) {
      throw new Error(
        `Value is not a valid LocalizableUserText: ${JSON.stringify(value)} has unknown key ${unknownKey}`,
      );
    }
  }
  return Object.fromEntries(
    UserLocaleValues.map((key) => [key, value[key]]).filter(
      ([, value]) => isNonNullish(value) && value.length > 0,
    ),
  );
}

const parseLocalizableUserText: GraphQLScalarLiteralParser<LocalizableUserText> =
  function parseLocalizableUserText(ast, variables) {
    const value = Object.create(null);
    if (ast.kind !== Kind.OBJECT) {
      throw new Error();
    }
    if (Object.keys(ast.fields).length === 0) {
      throw new Error(`Invalid LocalizableUserText object`);
    }

    for (const field of ast.fields) {
      const prop = field.name.value;
      if (!UserLocaleValues.includes(prop as any)) {
        throw new Error(`Invalid LocalizableUserText object`);
      }
      if (field.value.kind !== Kind.STRING) {
        throw new Error(`Invalid LocalizableUserText object`);
      }
      value[prop] = field.value.value;
    }
    return value;
  };

export const LocalizableUserText = scalarType({
  asNexusMethod: "localizableUserText",
  sourceType: "LocalizableUserText",
  ...({
    name: "LocalizableUserText",
    serialize: (value) => ensureLocalizableUserText(value, false),
    parseValue: (value) => ensureLocalizableUserText(value, true),
    parseLiteral: parseLocalizableUserText,
    extensions: {
      jsonSchema: LOCALIZABLE_USER_TEXT_SCHEMA,
    },
  } satisfies GraphQLScalarTypeConfig<LocalizableUserText, LocalizableUserText>),
});
