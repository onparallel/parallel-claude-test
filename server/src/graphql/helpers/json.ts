import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import { arg, asNexusMethod, core } from "nexus";

export const JSONObject = asNexusMethod(GraphQLJSONObject, "jsonObject");
export const JSON = asNexusMethod(GraphQLJSON, "json");

export function jsonObjectArg(opts: core.NexusArgConfig<"JSONObject">) {
  return arg({ ...opts, type: "JSONObject" });
}

export function jsonArg(opts: core.NexusArgConfig<"JSON">) {
  return arg({ ...opts, type: "JSON" });
}
