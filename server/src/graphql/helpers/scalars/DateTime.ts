import { GraphQLScalarType, GraphQLScalarTypeConfig, Kind } from "graphql";
import { GraphQLDateTime } from "graphql-scalars";
import { arg, asNexusMethod, core } from "nexus";
import { isValidDate } from "../../../util/time";

export const DateTime = asNexusMethod(GraphQLDateTime, "datetime", "Date");

export function datetimeArg(opts?: Omit<core.NexusArgConfig<"DateTime">, "type">) {
  return arg({ ...opts, type: "DateTime" });
}

export const Date = asNexusMethod(
  new GraphQLScalarType({
    name: "Date",
    description:
      "A date string, such as 2007-12-03, compliant with the `full-date` " +
      "format outlined in section 5.6 of the RFC 3339 profile of the " +
      "ISO 8601 standard for representation of dates and times using " +
      "the Gregorian calendar.",
    serialize(value) {
      if (typeof value === "string") {
        if (isValidDate(value)) {
          return value;
        }
        throw new Error(`Date cannot represent an invalid date-string ${value}.`);
      } else {
        throw new Error("Date cannot represent a non string " + JSON.stringify(value));
      }
    },
    parseValue(value) {
      if (!(typeof value === "string")) {
        throw new Error(`Date cannot represent non string type ${JSON.stringify(value)}`);
      }
      if (isValidDate(value)) {
        return value;
      }
      throw new Error(`Date cannot represent an invalid date-string ${value}.`);
    },
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) {
        throw new Error(`Date cannot represent non string type ${"value" in ast && ast.value}`);
      }
      const { value } = ast;
      if (isValidDate(value)) {
        return value;
      }
      throw new Error(`Date cannot represent an invalid date-string ${String(value)}.`);
    },
    extensions: {
      codegenScalarType: "string",
      jsonSchema: {
        type: "string",
        format: "date",
      },
    },
  } as GraphQLScalarTypeConfig<string, string>),
  "date",
  "string"
);

export function dateArg(opts?: Omit<core.NexusArgConfig<"Date">, "type">) {
  return arg({ ...opts, type: "Date" });
}
