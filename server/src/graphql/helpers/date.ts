import { GraphQLDateTime } from "graphql-iso-date";
import { arg, asNexusMethod, core } from "nexus";

export const DateTime = asNexusMethod(GraphQLDateTime, "datetime");

export function dateTimeArg(opts: core.NexusArgConfig<"DateTime">) {
  return arg({ ...opts, type: "DateTime" });
}
