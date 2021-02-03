import { core } from "@nexus/schema";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { ArgValidationError } from "../errors";
import Ajv from "ajv";

export function jsonSchema(schema: any) {
  return <TypeName extends string, FieldName extends string>(
    prop: (args: core.ArgsValue<TypeName, FieldName>) => any,
    argName: string
  ) => {
    return ((_, args, ctx, info) => {
      const value = prop(args);
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
