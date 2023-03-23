import Ajv from "ajv";
import { GraphQLScalarLiteralParser, GraphQLScalarTypeConfig, Kind } from "graphql";
import { scalarType } from "nexus";
import { isDefined } from "remeda";
import { UserLocale, UserLocaleValues } from "../../../db/__types";

const LOCALIZABLE_USER_TEXT_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(UserLocaleValues.map((key) => [key, { type: "string" }])),
  additionalProperties: false,
  anyOf: UserLocaleValues.map((key) => ({ required: [key] })),
};

export type LocalizableUserText = { [locale in UserLocale]?: string };

function ensureLocalizableUserText(value: any, strict: boolean): LocalizableUserText {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Value is not a valid LocalizableUserText: ${value}`);
  }
  const ajv = new Ajv();
  if (
    !ajv.validate(
      { ...LOCALIZABLE_USER_TEXT_SCHEMA, additionalProperties: strict === true ? false : true },
      value
    )
  ) {
    throw new Error(
      `Value is not a valid LocalizableUserText: ${JSON.stringify(value)} ${ajv.errorsText()}`
    );
  }
  return Object.fromEntries(
    UserLocaleValues.map((key) => [key, value[key]]).filter(
      ([, value]) => isDefined(value) && value.length > 0
    )
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
