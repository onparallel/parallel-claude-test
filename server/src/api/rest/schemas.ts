import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { JSONSchema6, JSONSchema6TypeName } from "json-schema";
import { FromSchema, JSONSchema as _JSONSchema } from "json-schema-to-ts";
import { isValidTime, isValidTimezone } from "../../util/validators";

export type JsonSchema = Exclude<_JSONSchema, boolean>;

export type JsonSchemaFor<T> = JsonSchema & {
  __type?: T;
};

export function schema<T>(value: T): JsonSchemaFor<FromSchema<T>> {
  return value;
}

export function buildValidateSchema<T>(
  schema: JsonSchemaFor<T>
): ValidateFunction<T>;
export function buildValidateSchema<T = any>(
  schema: JsonSchema
): ValidateFunction<T>;
export function buildValidateSchema<T = any>(schema: JsonSchema) {
  const ajv = new Ajv({ strict: false });
  addFormats(ajv, ["date-time"]);
  ajv.addFormat("time-zone", isValidTimezone);
  ajv.addFormat("time", isValidTime);
  return ajv.compile<T>(schema);
}

export function schemaToTable(schema: JsonSchema) {
  const rows = [
    "| Field | Type | Format | Description |",
    "|-------|------|--------|-------------|",
  ];

  return rows.concat(schemaToRows(schema)).join("\n");
}

function schemaToRows(schema: JsonSchema, name?: string): string[] {
  switch (schema.type) {
    case "array":
      return schemaToRows(schema.items as any, `${name ?? "$"}[]`);
    case "object":
      if (schema.properties) {
        return Object.entries(
          schema.properties
        ).flatMap(([propName, propSchema]) =>
          schemaToRows(
            propSchema as any,
            name ? `${name}.${propName}` : propName
          )
        );
      }
      return [];
    default:
      const field = name;
      const type = getType(schema);
      const format = getFormat(schema);
      const description = schema.description ?? "";
      return [`| ${field} | ${type} | ${format} | ${description} |`];
  }
}

function getType(schema: JsonSchema) {
  const type = schema.type;
  if (type === undefined) {
    return "";
  } else if (typeof type === "string") {
    return typeToString(type, schema as any);
  } else {
    return (type as JSONSchema6TypeName[])
      .map((t) => typeToString(t, schema as any))
      .join(" &#124; ");
  }
}

function typeToString(type: JSONSchema6TypeName, schema: JSONSchema6) {
  switch (type) {
    case "boolean":
    case "integer":
    case "number":
    case "null":
    case "any":
      return type;
    case "string":
      if (schema.enum) {
        return schema.enum
          .map((value) => JSON.stringify(value))
          .join(" &#124; ");
      } else if (schema.const) {
        return JSON.stringify(schema.const);
      } else {
        return type;
      }
  }
}

function getFormat(schema: JsonSchema) {
  if (schema.format) {
    switch (schema.format) {
      case "date-time":
        return `[date-time](https://en.wikipedia.org/wiki/ISO_8601)`;
      case "time-zone":
        return `[time-zone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)`;
      default:
        return schema.format;
    }
  }
  return "";
}
