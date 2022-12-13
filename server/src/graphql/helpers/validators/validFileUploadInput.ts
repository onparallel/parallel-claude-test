import { core } from "nexus";
import { ArgValidationError, MaxFileSizeExceededError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validFileUploadInput<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => {
    contentType: string;
    filename: string;
    size: number;
  },
  opts: { maxSizeBytes?: number; contentType?: string },
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const file = prop(args);
    if (opts.maxSizeBytes && file.size > opts.maxSizeBytes) {
      throw new MaxFileSizeExceededError(
        info,
        argName,
        `File size exceeds the max file size allowed of ${opts.maxSizeBytes} bytes`
      );
    }
    if (opts.contentType && file.contentType !== opts.contentType) {
      throw new ArgValidationError(
        info,
        "contentType",
        `Expected ${opts.contentType}, got ${file.contentType}`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
