import { core } from "nexus";
import { isDefined, uniq } from "remeda";
import { discriminator } from "../../../util/discriminator";
import { fromGlobalId, isGlobalId } from "../../../util/globalId";
import { parseTextWithPlaceholders } from "../../../util/slate/placeholders";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validTextWithPlaceholders<TypeName extends string, FieldName extends string>(
  props: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number | undefined,
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    const value = props(args);
    if (!value) {
      return;
    }

    const globalIds = uniq(
      parseTextWithPlaceholders(value)
        .filter(discriminator("type", "placeholder" as const))
        .filter((p) => isGlobalId(p.value))
        .map((p) => p.value),
    );

    const petitionId = petitionIdProp?.(args);

    if (globalIds.length > 0 && !isDefined(petitionId)) {
      throw new ArgValidationError(
        info,
        argName,
        `Missing petitionId prop for globalId validation`,
      );
    }

    if (globalIds.some((globalId) => !isGlobalId(globalId, "PetitionField"))) {
      throw new ArgValidationError(
        info,
        argName,
        `Expected all ${globalIds} to be a PetitionField`,
      );
    }

    const fields = await ctx.petitions.loadField(
      globalIds.map((globalId) => fromGlobalId(globalId).id),
    );

    for (const field of fields) {
      // deleted fields are OK
      if (isDefined(field) && field.petition_id !== petitionId) {
        throw new ArgValidationError(
          info,
          argName,
          `Expected PetitionField:${field.id} to belong to Petition:${petitionId}`,
        );
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
