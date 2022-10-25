import { GraphQLDateTime, GraphQLJSON, GraphQLJSONObject } from "graphql-scalars";
import { GraphQLUpload as _GraphQLUpload } from "graphql-upload";
import { arg, asNexusMethod, core, enumType, scalarType } from "nexus";
import { DURATION_SCHEMA, ensureDuration, parseDuration } from "./duration";

export const GraphQLUpload = scalarType({
  ..._GraphQLUpload,
  sourceType: "Promise<FileUpload>",
});

export function uploadArg(opts?: Omit<core.NexusArgConfig<"Upload">, "type">) {
  return arg({ ...opts, type: "Upload" });
}

export const JSONObject = asNexusMethod(GraphQLJSONObject, "jsonObject", "{[key: string]: any}");
export const JSON = asNexusMethod(GraphQLJSON, "json", "any");

export function jsonObjectArg(opts?: Omit<core.NexusArgConfig<"JSONObject">, "type">) {
  return arg({ ...opts, type: "JSONObject" });
}

export function jsonArg(opts?: Omit<core.NexusArgConfig<"JSON">, "type">) {
  return arg({ ...opts, type: "JSON" });
}

export const DateTime = asNexusMethod(GraphQLDateTime, "datetime", "Date");

export function datetimeArg(opts?: Omit<core.NexusArgConfig<"DateTime">, "type">) {
  return arg({ ...opts, type: "DateTime" });
}

export const Duration = scalarType({
  name: "Duration",
  asNexusMethod: "duration",
  sourceType: "Duration",
  serialize: ensureDuration,
  parseValue: ensureDuration,
  parseLiteral: parseDuration,
  extensions: {
    jsonSchema: DURATION_SCHEMA,
  },
});

export function durationArg(opts?: Omit<core.NexusArgConfig<"Duration">, "type">) {
  return arg({ ...opts, type: "Duration" });
}

export const Success = enumType({
  name: "Success",
  description: "Represents a successful execution.",
  members: ["SUCCESS"],
});

export const SUCCESS = "SUCCESS" as const;
