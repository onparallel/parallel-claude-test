import { FileUpload } from "graphql-upload/Upload.js";
import { core } from "nexus";
import { MaybeArray } from "../../../util/types";
import { validateAnd } from "../validateArgs";
import { contentType as contentTypeValidator } from "./contentType";
import { maxFileSize } from "./maxFileSize";

export function validateFile<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => Promise<FileUpload>,
  { contentType, maxSize }: { contentType: MaybeArray<string>; maxSize: number },
  argName: string,
) {
  return validateAnd(
    contentTypeValidator(prop, contentType, argName),
    maxFileSize(prop, maxSize, argName),
  );
}
