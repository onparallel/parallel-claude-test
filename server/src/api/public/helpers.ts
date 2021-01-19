import {
  JSONSchema6,
  JSONSchema6Definition,
  JSONSchema6TypeName,
} from "json-schema";
import { outdent } from "outdent";
import { RestResponse } from "../rest/core";
import { enumParam, intParam } from "../rest/params";
import { JSONSchema, JSONSchemaFor } from "../rest/schemas";

export function paginationParams() {
  return {
    offset: intParam({
      description: "How many items to skip",
      defaultValue: 0,
      required: false,
      minimum: 0,
    }),
    limit: intParam({
      description: "How many items to return at most",
      required: true,
      minimum: 0,
    }),
  };
}

export function sortByParam<T extends string>(values: T[]) {
  return {
    sortBy: enumParam({
      description: "Sort this resource list by one of the available options",
      values: values.flatMap((option) => [
        `${option}_ASC`,
        `${option}_DESC`,
      ]) as `${T}_${"ASC" | "DESC"}`[],
      required: false,
      array: true,
    }),
  };
}

export function Success<T>(schema?: JSONSchemaFor<T>): RestResponse<T> {
  return {
    description: outdent`
    Successful operation
    ${schema ? schemaToTable(schema) : ""}
    `,
    schema,
  };
}

export function schemaToTable(schema: JSONSchema) {
  const rows = [
    "| Field | Type | Format | Description |",
    "|-------|------|--------|-------------|",
  ];

  return rows.concat(schemaToRows(schema)).join("\n");
}

function schemaToRows(schema: JSONSchema, name?: string): string[] {
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

function getType(schema: JSONSchema) {
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

function getFormat(schema: JSONSchema) {
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
