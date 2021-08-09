import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import { arg, asNexusMethod, core } from "@nexus/schema";

export const JSONObject = asNexusMethod(GraphQLJSONObject, "jsonObject", "{[key: string]: any}");
export const JSON = asNexusMethod(GraphQLJSON, "json", "any");

export function jsonObjectArg(opts?: Omit<core.NexusArgConfig<"JSONObject">, "type">) {
  return arg({ ...opts, type: "JSONObject" });
}

export function jsonArg(opts?: Omit<core.NexusArgConfig<"JSON">, "type">) {
  return arg({ ...opts, type: "JSON" });
}
