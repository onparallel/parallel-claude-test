import { fromStream } from "file-type";
import { FileUpload } from "graphql-upload/Upload.js";
import match from "mime-match";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function contentType<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, Promise<FileUpload> | null | undefined>,
  contentType: MaybeArray<string>,
) {
  return (async (_, args, ctx, info) => {
    const mimes = unMaybeArray(contentType);
    const [filePromise, argName] = getArgWithPath(args, prop);
    const upload = await filePromise;
    if (!upload) {
      return;
    }

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
