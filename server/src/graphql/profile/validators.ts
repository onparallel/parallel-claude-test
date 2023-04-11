import Ajv from "ajv";
import { TableTypes } from "../../db/helpers/BaseRepository";
import { Arg } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validProfileFieldValue<
  TypeName extends string,
  FieldName extends string,
  TFieldIdArg extends Arg<TypeName, FieldName, number>,
  TValuedArg extends Arg<TypeName, FieldName, any>
>(profileTypeFieldId: TFieldIdArg, valueArg: TValuedArg) {
  return (async (_, args, ctx, info) => {
    const value = args[valueArg] as any;
    const field = (await ctx.profiles.loadProfileTypeField(
      args[profileTypeFieldId] as unknown as number
    ))!;
    try {
      validateProfileFieldValue(field, value);
    } catch (e) {
      if (e instanceof Error) {
        throw new ApolloError(
          `Invalid profile field value: ${e.message}`,
          "INVALID_PROFILE_FIELD_VALUE"
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

const STRING_VALUE_SCHEMA = {
  type: "object",
  properties: {
    value: { type: "string" },
  },
  additionalProperties: false,
};

function validateProfileFieldValue(field: TableTypes["profile_type_field"], content: any) {
  const ajv = new Ajv();
  switch (field.type) {
    case "SHORT_TEXT":
      const valid = ajv.validate(STRING_VALUE_SCHEMA, content);
      if (!valid) {
        throw new Error(ajv.errorsText());
      }
  }
}
