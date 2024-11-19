import Ajv from "ajv";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function jsonSchema(schema: any) {
  return <TypeName extends string, FieldName extends string>(
    prop: ArgWithPath<TypeName, FieldName, any>,
  ) => {
    return ((_, args, ctx, info) => {
      const [value, argName] = getArgWithPath(args, prop);
      const ajv = new Ajv();
      if (!value) {
        return;
      }
      const valid = ajv.validate(schema, value);
      if (!valid) {
        throw new ArgValidationError(info, argName, ajv.errorsText());
      }
    }) as FieldValidateArgsResolver<TypeName, FieldName>;
  };
}
