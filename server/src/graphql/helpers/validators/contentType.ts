import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { FileUpload } from "graphql-upload";
import match from "mime-match";
import { fromStream } from "file-type";

export function contentType<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => Promise<FileUpload>,
  contentType: string,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const upload = await prop(args);
    // check mime type from request
    if (match(upload.mimetype, contentType)) {
      // check mime type from file
      const result = await fromStream(upload.createReadStream());
      if (result && match(result.mime, contentType)) {
        return;
      }
    }
    throw new ArgValidationError(info, argName, `Expected ${upload.mimetype}`);
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
