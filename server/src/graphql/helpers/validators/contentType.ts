import { fromStream } from "file-type";
import { FileUpload } from "graphql-upload/Upload.js";
import match from "mime-match";
import { core } from "nexus";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function contentType<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => Promise<FileUpload>,
  contentType: MaybeArray<string>,
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    const mimes = unMaybeArray(contentType);
    const upload = await prop(args);
    // check mime type from request
    if (mimes.some((mime) => match(upload.mimetype, mime))) {
      // check mime type from file
      const result = await fromStream(upload.createReadStream());
      if (result && mimes.some((mime) => match(result.mime, mime))) {
        return;
      } else {
        throw new ArgValidationError(
          info,
          argName,
          `Expected ${mimes.join(",")}, got ${result?.mime ?? "Unknown"}`,
        );
      }
    } else {
      throw new ArgValidationError(
        info,
        argName,
        `Expected ${mimes.join(",")}, got ${upload.mimetype}`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
