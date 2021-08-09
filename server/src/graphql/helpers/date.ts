import { GraphQLDateTime } from "graphql-iso-date";
import { arg, asNexusMethod, core } from "@nexus/schema";
import { GraphQLScalarType } from "graphql";

export const DateTime = asNexusMethod(GraphQLDateTime as GraphQLScalarType, "datetime", "Date");

export function datetimeArg(opts?: Omit<core.NexusArgConfig<"DateTime">, "type">) {
  return arg({ ...opts, type: "DateTime" });
}
