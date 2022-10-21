import { GraphQLDateTime, GraphQLJSON, GraphQLJSONObject } from "graphql-scalars";
import { GraphQLUpload as _GraphQLUpload } from "graphql-upload";
import { arg, asNexusMethod, core, enumType, scalarType } from "nexus";

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

const ISO_DURATION_REGEX =
  /P(?:([\d]+\.?[\d]*|\.[\d]+)Y)?(?:([\d]+\.?[\d]*|\.[\d]+)M)?(?:([\d]+\.?[\d]*|\.[\d]+)W)?(?:([\d]+\.?[\d]*|\.[\d]+)D)?(?:T(?:([\d]+\.?[\d]*|\.[\d]+)H)?(?:([\d]+\.?[\d]*|\.[\d]+)M)?(?:([\d]+\.?[\d]*|\.[\d]+)S)?)?$/;
export const ISO8601Duration = scalarType({
  name: "ISO8601Duration",
  asNexusMethod: "duration",
  sourceType: "string",
  parseLiteral: (v) => {
    if (v.kind !== "StringValue" || !v.value.match(ISO_DURATION_REGEX)) {
      throw new Error();
    }
    return v.value;
  },
  parseValue: (v) => v,
});

export function iso8601DurationArg(opts?: Omit<core.NexusArgConfig<"ISO8601Duration">, "type">) {
  return arg({ ...opts, type: "ISO8601Duration" });
}

export const Success = enumType({
  name: "Success",
  description: "Represents a successful execution.",
  members: ["SUCCESS"],
});

export const SUCCESS = "SUCCESS" as const;
