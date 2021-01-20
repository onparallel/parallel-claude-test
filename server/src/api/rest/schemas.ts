import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import escapeHTML from "escape-html";
import { JSONSchema6, JSONSchema6TypeName } from "json-schema";
import { FromSchema, JSONSchema as _JSONSchema } from "json-schema-to-ts";
import { outdent } from "outdent";
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
  addFormats(ajv, ["date-time", "email"]);
  ajv.addFormat("time-zone", isValidTimezone);
  ajv.addFormat("time", isValidTime);
  return ajv.compile<T>(schema);
}

export function documentSchema(schema: JsonSchema) {
  return schemasToTables([schema]);
}

function schemasToTables(schemas: JsonSchema[]): string {
  const result: string[] = [];
  let schema;
  const seen = new Set<string>();
  while ((schema = schemas.pop())) {
    if (schema.type === "object") {
      const name = getType(schema, []);
      if (seen.has(name)) {
        continue;
      }
      result.push(outdent`
        ### ${escapeHTML(name)}
        | Field | Type | Format | Description |
        |-------|------|--------|-------------|
      `);
      result.push(...schemaToRows(schema, schemas));
      result.push("----");
      seen.add(name);
    }
    if (schema.type === "array") {
      schemas.push(schema.items as any);
    }
  }
  return result.join("\n");
}

function schemaToRows(schema: JsonSchema, schemas: JsonSchema[]): string[] {
  return Object.entries<JsonSchema>((schema.properties ?? {}) as any).map(
    ([name, prop]) => {
      const type = getType(prop, schemas).replace(/\|/g, "&#124;");
      const format = getFormat(prop);
      const description = prop.description ?? "";
      return `| ${name}${
        schema.required?.includes(name) ? "" : ` *optional*`
      } | ${type} | ${format} | ${description} |`;
    }
  );
}

export function getType(schema: JsonSchema, schemas: JsonSchema[]): string {
  if (schema.type === "object") {
    schemas.push(schema);
    return schema.title ?? "*unknown*";
  } else if (schema.type === "array") {
    const type = getType(schema.items as any, schemas);
    return `${type.includes("|") ? `(${type})` : type}[]`;
  } else if (typeof schema.type === "string") {
    return typeToString(schema.type, schema as any);
  } else if (schema.type) {
    return (schema.type as JSONSchema6TypeName[])
      .map((type) => {
        if (type === "object" || type === "array") {
          return getType({ ...schema, type }, schemas);
        } else {
          return typeToString(type, schema as any);
        }
      })
      .join(" | ");
  } else if (schema.oneOf) {
    return (schema.oneOf as JsonSchema[])
      .map((option) => getType(option, schemas))
      .join(" | ");
  }
  return "*unknown*";
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
    case "object":
      return schema.title ?? "any";
  }
  return "*unknown*";
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
