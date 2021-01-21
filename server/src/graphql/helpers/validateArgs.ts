import { FieldValidateArgsResolver } from "./validateArgsPlugin";
import { ValidatorOrConditionError } from "./errors";
import { Maybe } from "../../util/types";
import { ArgsValue } from "@nexus/schema/dist/core";

export function validateAnd<TypeName extends string, FieldName extends string>(
  ...validators: FieldValidateArgsResolver<TypeName, FieldName>[]
) {
  return (async (root, args, ctx, info) => {
    await Promise.all(
      validators.map((validator) => validator(root, args, ctx, info))
    );
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateOr<TypeName extends string, FieldName extends string>(
  ...validators: FieldValidateArgsResolver<TypeName, FieldName>[]
) {
  return (async (root, args, ctx, info) => {
    const results: Maybe<string>[] = await Promise.all(
      validators.map(async (validator) => {
        try {
          await validator(root, args, ctx, info);
          return null;
        } catch ({ message }) {
          return message;
        }
      })
    );

    // if every validator throws an error, the OR condition fails
    if (results.every((r) => r !== null)) {
      const errorMessage = results.filter((r) => r !== null).join("; ");
      throw new ValidatorOrConditionError(info, errorMessage);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateIf<TypeName extends string, FieldName extends string>(
  check: (args: ArgsValue<TypeName, FieldName>) => boolean,
  validator: FieldValidateArgsResolver<TypeName, FieldName>
) {
  return (async (root, args, ctx, info) => {
    if (check(args)) {
      await validator(root, args, ctx, info);
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
