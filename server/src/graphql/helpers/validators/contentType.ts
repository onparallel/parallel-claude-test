import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { FileUpload } from "graphql-upload";
import match from "mime-match";
import { fromStream } from "file-type";
import { MaybeArray } from "../../../util/types";
import { unMaybeArray } from "../../../util/arrays";

export function contentType<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => Promise<FileUpload>,
  contentType: MaybeArray<string>,
  argName: string
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
          `Expected ${mimes.join(",")}, got ${result?.mime ?? "Unknown"}`
        );
      }
    } else {
      throw new ArgValidationError(
        info,
        argName,
        `Expected ${mimes.join(",")}, got ${upload.mimetype}`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
