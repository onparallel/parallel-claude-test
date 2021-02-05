import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
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
