import { objectType, scalarType } from "@nexus/schema";
import { ReadStream } from "fs";

export type UploadedFile = {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => ReadStream;
};

export const SupportMethodResponse = objectType({
  name: "SupportMethodResponse",
  description: "Return type for all support methods",
  definition(t) {
    t.field("result", { type: "Result" });
    t.nullable.string("message");
  },
});

export const UploadScalar = scalarType({
  name: "Upload",
  description: "The `Upload` scalar type represents a file upload.",
  parseValue(value: any) {
    return value;
  },
  serialize(value: any) {
    return value;
  },
  parseLiteral() {
    throw new Error("‘Upload’ scalar literal unsupported.");
  },
});
