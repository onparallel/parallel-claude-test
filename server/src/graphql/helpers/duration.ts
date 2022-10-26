import Ajv from "ajv";
import { GraphQLScalarLiteralParser, Kind, ValueNode } from "graphql";
import { ObjMap } from "graphql/jsutils/ObjMap";
import { Maybe } from "graphql/jsutils/Maybe";
import { isDefined } from "remeda";

const KEYS = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];

export const DURATION_SCHEMA = {
  type: "object",
  properties: Object.fromEntries(KEYS.map((key) => [key, { type: "number" }])),
  additionalProperties: false,
  anyOf: KEYS.map((key) => ({ required: [key] })),
};

export function ensureDuration(value: any, strict: boolean): Duration {
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

export const parseDuration: GraphQLScalarLiteralParser<Duration> = function parseDuration(
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

export function addDuration(d1: Duration, d2: Duration) {
  const newDuration: Duration = {};
  KEYS.forEach((key) => {
    const dKey = key as keyof Duration;
    newDuration[dKey] = (d1[dKey] ?? 0) + (d2[dKey] ?? 0);
  });
  return newDuration;
}

export function multiplyDuration(duration: Duration, multiplier: number) {
  const newDuration: Duration = {};
  Object.entries(duration).forEach(([unit, value]) => {
    newDuration[unit as keyof Duration] = value * multiplier;
  });
  return newDuration;
}

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
