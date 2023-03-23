import { default as _GraphQLUpload } from "graphql-upload/GraphQLUpload.js";
import { arg, core, scalarType } from "nexus";

export const GraphQLUpload = scalarType({
  ..._GraphQLUpload,
  sourceType: "Promise<FileUpload>",
});

export function uploadArg(opts?: Omit<core.NexusArgConfig<"Upload">, "type">) {
  return arg({ ...opts, type: "Upload" });
}
