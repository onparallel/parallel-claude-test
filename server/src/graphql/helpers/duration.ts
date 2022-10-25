import Ajv from "ajv";
import { Kind, ValueNode } from "graphql";

export const DURATION_SCHEMA = {
  type: "object",
  properties: {
    years: { type: ["number", "null"] },
    months: { type: ["number", "null"] },
    weeks: { type: ["number", "null"] },
    days: { type: ["number", "null"] },
    hours: { type: ["number", "null"] },
    minutes: { type: ["number", "null"] },
    seconds: { type: ["number", "null"] },
  },
  additionalProperties: false,
};

export function ensureDuration(value: any): object {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`JSONObject cannot represent non-object value: ${value}`);
  }

  if (Object.keys(value).length === 0) {
    throw new Error("Expected non empty input.");
  }
  // this is to strip all 'PostgresInterval' metadata.
  // without this the ajv validation will fail on the additionalProperties: false check
  const duration = Object.assign({}, value);
  const ajv = new Ajv();
  if (!ajv.validate(DURATION_SCHEMA, duration)) {
    throw new Error(ajv.errorsText());
  }

  return duration;
}

export function parseDuration(ast: ValueNode, variables: any) {
  const value = Object.create(null);
  if (ast.kind !== Kind.OBJECT) {
    throw new Error();
  }
  ast.fields.forEach((field) => {
    value[field.name.value] = parseLiteral(field.value, variables);
  });

  if (Object.keys(value).length === 0) {
    throw new Error("Expected non empty input.");
  }

  const ajv = new Ajv();
  if (!ajv.validate(DURATION_SCHEMA, value)) {
    throw new Error(ajv.errorsText());
  }

  return value;
}

function parseLiteral(ast: ValueNode, variables: any): any {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseDuration(ast, variables);
    case Kind.LIST:
      return ast.values.map((n) => parseLiteral(n, variables));
    case Kind.NULL:
      return null;
    case Kind.VARIABLE: {
      const name = ast.name.value;
      return variables ? variables[name] : undefined;
    }
  }
}
