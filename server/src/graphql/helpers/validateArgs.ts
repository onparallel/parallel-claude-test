import { FieldValidateArgsResolver } from "./validateArgsPlugin";

export function validateAnd<TypeName extends string, FieldName extends string>(
  ...validators: FieldValidateArgsResolver<TypeName, FieldName>[]
) {
  return (async (root, args, ctx, info) => {
    await Promise.all(
      validators.map((validator) => validator(root, args, ctx, info))
    );
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
