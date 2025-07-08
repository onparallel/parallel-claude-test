import { FileUpload } from "graphql-upload/Upload.js";
import { MaybeArray, unMaybeArray } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { MaxFileSizeExceededError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export async function exceedsMaxSize(file: FileUpload, maxSizeBytes: number) {
  return await new Promise<boolean>((resolve) => {
    let bytesRead = 0;
    const stream = file.createReadStream();
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
}

export function maxFileSize<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, MaybeArray<Promise<FileUpload>> | null | undefined>,
  maxSizeBytes: number,
) {
  return (async (_, args, ctx, info) => {
    const [data, argName] = getArgWithPath(args, prop);
    if (!data) {
      return;
    }

    const promiseArray = unMaybeArray(data);

    for (const promise of promiseArray) {
      const maxSizeExceeded = await exceedsMaxSize(await promise, maxSizeBytes);
      if (maxSizeExceeded) {
        throw new MaxFileSizeExceededError(
          info,
          argName,
          `File exceeded max size of ${maxSizeBytes} bytes`,
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
