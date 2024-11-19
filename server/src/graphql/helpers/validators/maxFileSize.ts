import { FileUpload } from "graphql-upload/Upload.js";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { MaxFileSizeExceededError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function maxFileSize<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, Promise<FileUpload> | null | undefined>,
  maxSizeBytes: number,
) {
  return (async (_, args, ctx, info) => {
    const [promise, argName] = getArgWithPath(args, prop);
    if (!promise) {
      return;
    }

    const { createReadStream } = await promise;
    const maxSizeExceeded = await new Promise<boolean>((resolve) => {
      let bytesRead = 0;
      const stream = createReadStream();
      stream
        .on("data", (buffer: Buffer) => {
          bytesRead += buffer.byteLength;
          if (bytesRead > maxSizeBytes) {
            stream.destroy();
            resolve(true);
          }
        })
        .on("error", () => {
          if (!stream.destroyed) {
            stream.destroy();
          }
          resolve(true);
        })
        .on("end", () => resolve(false))
        .resume();
    });

    if (maxSizeExceeded) {
      throw new MaxFileSizeExceededError(
        info,
        argName,
        `File exceeded max size of ${maxSizeBytes} bytes`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
