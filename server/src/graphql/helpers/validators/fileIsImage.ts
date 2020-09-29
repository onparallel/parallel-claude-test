import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";

export function fileIsImage<TypeName extends string, FieldName extends string>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>
  ) => Promise<{ mimetype: string }>,
  argName: string
) {
  return (async (_, args, ctx, info) => {
    const { mimetype } = await prop(args);

    if (!mimetype.startsWith("image")) {
      throw new ArgValidationError(info, argName, `File must be an image`);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
