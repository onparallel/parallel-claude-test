import { GraphQLDateTime } from "graphql-scalars";
import { arg, asNexusMethod, core } from "nexus";

export const DateTime = asNexusMethod(GraphQLDateTime, "datetime", "Date");

export function datetimeArg(opts?: Omit<core.NexusArgConfig<"Date">, "type">) {
  return arg({ ...opts, type: "DateTime" });
}
