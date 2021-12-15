import { core } from "nexus";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError, MaxFileSizeExceededError } from "../errors";
import { FileUpload } from "graphql-upload";

export function maxFileSize<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => Promise<FileUpload>,
  maxSizeBytes: number,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const { createReadStream } = await prop(args);
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
      throw new ArgValidationError(
        info,
        argName,
        `File exceeded max size of ${maxSizeBytes} bytes`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function fileUploadInputMaxSize<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => {
    contentType: string;
    filename: string;
    size: number;
  },
  maxSizeBytes: number,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const file = prop(args);
    if (file.size > maxSizeBytes) {
      throw new MaxFileSizeExceededError(
        info,
        argName,
        `File size exceeds the max file size allowed of ${maxSizeBytes} bytes`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
