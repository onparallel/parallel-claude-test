import { arg, core, scalarType } from "nexus";
import Ajv from "ajv";
import { GraphQLScalarLiteralParser, GraphQLScalarTypeConfig, Kind, ValueNode } from "graphql";
import { ObjMap } from "graphql/jsutils/ObjMap";
import { Maybe } from "graphql/jsutils/Maybe";
import { isDefined } from "remeda";
import type { Duration as _Duration } from "date-fns";

const KEYS = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

const DURATION_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(KEYS.map((key) => [key, { type: "number" }])),
  additionalProperties: false,
  anyOf: KEYS.map((key) => ({ required: [key] })),
};

function ensureDuration(value: any, strict: boolean): _Duration {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Value is not a valid Duration: ${value}`);
  }
  const ajv = new Ajv();
  if (
    !ajv.validate(
      { ...DURATION_SCHEMA, additionalProperties: strict === true ? false : true },
      value
    )
  ) {
    throw new Error(`Value is not a valid Duration: ${value} ${ajv.errorsText()}`);
  }
  return Object.fromEntries(
    KEYS.map((key) => [key, value[key]]).filter(([, value]) => isDefined(value) && value > 0)
  );
}

const parseDuration: GraphQLScalarLiteralParser<_Duration> = function parseDuration(
  ast,
  variables
) {
  const value = Object.create(null);
  if (ast.kind !== Kind.OBJECT) {
    throw new Error();
  }
  if (Object.keys(ast.fields).length === 0) {
    throw new Error(`Invalid Duration object`);
  }

  for (const field of ast.fields) {
    const prop = field.name.value;
    if (!KEYS.includes(prop)) {
      throw new Error(`Invalid Duration object`);
    }
    value[prop] = parseDurationAmount(field.value, variables);
  }
  return value;
};

function parseDurationAmount(ast: ValueNode, variables: Maybe<ObjMap<unknown>>): any {
  switch (ast.kind) {
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.VARIABLE: {
      const name = ast.name.value;
      return variables ? variables[name] : undefined;
    }
    default: {
      throw new Error(`Invalid Duration object`);
    }
  }
}

export const Duration = scalarType({
  asNexusMethod: "duration",
  sourceType: "Duration",
  ...({
    name: "Duration",
    serialize: (value) => ensureDuration(value, false),
    parseValue: (value) => ensureDuration(value, true),
    parseLiteral: parseDuration,
    extensions: {
      jsonSchema: DURATION_SCHEMA,
    },
  } satisfies GraphQLScalarTypeConfig<Duration, Duration>),
});

export function durationArg(opts?: Omit<core.NexusArgConfig<"Duration">, "type">) {
  return arg({ ...opts, type: "Duration" });
}
