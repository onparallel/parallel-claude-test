import { arg, core, scalarType } from "@nexus/schema";
import { GraphQLUpload as _GraphQLUpload } from "graphql-upload";

export const GraphQLUpload = scalarType({
  ..._GraphQLUpload,
  rootTyping: "Promise<FileUpload>",
});

export function uploadArg(opts?: Omit<core.NexusArgConfig<"Upload">, "type">) {
  return arg({ ...opts, type: "Upload" });
}
