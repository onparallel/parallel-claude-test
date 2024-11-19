import { FileUpload } from "graphql-upload/Upload.js";
import { MaybeArray } from "../../../util/types";
import { ArgWithPath } from "../authorize";
import { validateAnd } from "../validateArgs";
import { contentType as contentTypeValidator } from "./contentType";
import { maxFileSize } from "./maxFileSize";

export function validateFile<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, Promise<FileUpload> | null | undefined>,
  { contentType, maxSize }: { contentType: MaybeArray<string>; maxSize: number },
) {
  return validateAnd(contentTypeValidator(prop, contentType), maxFileSize(prop, maxSize));
}
