import { GraphQLJSONObject, GraphQLJSON } from "graphql-scalars";
import { arg, asNexusMethod, core } from "nexus";

export const JSONObject = asNexusMethod(GraphQLJSONObject, "jsonObject", "{[key: string]: any}");
export const JSON = asNexusMethod(GraphQLJSON, "json", "any");

export function jsonObjectArg(opts?: Omit<core.NexusArgConfig<"JSONObject">, "type">) {
  return arg({ ...opts, type: "JSONObject" });
}

export function jsonArg(opts?: Omit<core.NexusArgConfig<"JSON">, "type">) {
  return arg({ ...opts, type: "JSON" });
}
