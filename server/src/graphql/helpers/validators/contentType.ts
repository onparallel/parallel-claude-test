import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import { FileUpload } from "graphql-upload";

export function contentType<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => Promise<FileUpload>,
  contentType: string | RegExp,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const { mimetype } = await prop(args);
    if (!mimetype.match(contentType)) {
      throw new ArgValidationError(
        info,
        argName,
        `Expected ${mimetype} to match ${contentType}`
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
