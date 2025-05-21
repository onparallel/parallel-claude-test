import { isNonNullish } from "remeda";
import { NexusGenInputs } from "../__types";
import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { validateAnd } from "../helpers/validateArgs";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { maxArrayLength } from "../helpers/validators/maxArrayLength";
import { notEmptyArray } from "../helpers/validators/notEmptyArray";

export function validateAdverseMediaSearchTermInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["AdverseMediaSearchTermInput"][] | null | undefined
  >,
) {
  return validateAnd(notEmptyArray(prop as any), maxArrayLength(prop as any, 10), ((
    _,
    args,
    ctx,
    info,
  ) => {
    const [value, argName] = getArgWithPath(args, prop);
    for (const [index, term] of (value ?? []).entries()) {
      const terms = [term.term, term.wikiDataId, term.entityId].filter(isNonNullish);
      if (terms.length !== 1) {
        throw new ArgValidationError(
          info,
          `${argName}[${index}]`,
          "Each search term must have exactly one of: term, wikiDataId, or entityId",
        );
      }

      if (isNonNullish(term.term) && term.term.length < 2) {
        throw new ArgValidationError(
          info,
          `${argName}[${index}].term`,
          "Search term must be at least 2 characters long",
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>);
}
