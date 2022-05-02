import { core } from "nexus";
import { FileUpload } from "graphql-upload";
import { validateAnd } from "../validateArgs";
import { contentType as contentTypeValidator } from "./contentType";
import { maxFileSize } from "./maxFileSize";
import { MaybeArray } from "../../../util/types";

export function validateFile<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => Promise<FileUpload>,
  { contentType, maxSize }: { contentType: MaybeArray<string>; maxSize: number },
  argName: string
) {
  return validateAnd(
    contentTypeValidator(prop, contentType, argName),
    maxFileSize(prop, maxSize, argName)
  );
}
