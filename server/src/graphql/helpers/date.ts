import { GraphQLDateTime } from "graphql-iso-date";
import { arg, asNexusMethod, core } from "@nexus/schema";

export const DateTime = asNexusMethod(GraphQLDateTime, "datetime");

export function dateTimeArg(
  opts: Omit<core.NexusArgConfig<"DateTime">, "type">
) {
  return arg({ ...opts, type: "DateTime" });
}
