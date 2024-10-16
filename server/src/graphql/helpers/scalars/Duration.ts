import type { Duration as _Duration } from "date-fns";
import { GraphQLScalarLiteralParser, GraphQLScalarTypeConfig, Kind, ValueNode } from "graphql";
import { Maybe } from "graphql/jsutils/Maybe";
import { ObjMap } from "graphql/jsutils/ObjMap";
import { arg, core, scalarType } from "nexus";
import { isNonNullish } from "remeda";

const KEYS = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"] as const;

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
  let valid = false;
  for (const key of KEYS) {
    if (key in value) {
      if (typeof value[key] === "number" && !Number.isNaN(value[key])) {
        valid = true;
      } else {
        throw new Error(
          `Value is not a valid Duration: ${JSON.stringify(value)} $.${key} is not a number`,
        );
      }
    }
  }
  if (!valid) {
    throw new Error(
      `Value is not a valid Duration: ${JSON.stringify(value)} missing at least one key (${KEYS.join(", ")})`,
    );
  }
  if (strict) {
    const unknownKey = Object.keys(value).find((key) => !KEYS.includes(key));
    if (isNonNullish(unknownKey)) {
      throw new Error(
        `Value is not a valid Duration: ${JSON.stringify(value)} has unknown key ${unknownKey}`,
      );
    }
  }
  return Object.fromEntries(
    KEYS.map((key) => [key, value[key]]).filter(([, value]) => isNonNullish(value) && value !== 0),
  );
}

const parseDuration: GraphQLScalarLiteralParser<_Duration> = function parseDuration(
  ast,
  variables,
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
  } satisfies GraphQLScalarTypeConfig<_Duration, _Duration>),
});

export function durationArg(opts?: Omit<core.NexusArgConfig<"Duration">, "type">) {
  return arg({ ...opts, type: "Duration" });
}
