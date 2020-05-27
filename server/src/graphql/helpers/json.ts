import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import { arg, asNexusMethod, core } from "@nexus/schema";

export const JSONObject = asNexusMethod(GraphQLJSONObject, "jsonObject");
export const JSON = asNexusMethod(GraphQLJSON, "json");

export function jsonObjectArg(
  opts: Omit<core.NexusArgConfig<"JSONObject">, "type">
) {
  return arg({ ...opts, type: "JSONObject" });
}

export function jsonArg(opts: Omit<core.NexusArgConfig<"JSON">, "type">) {
  return arg({ ...opts, type: "JSON" });
}
