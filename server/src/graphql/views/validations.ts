import { ArgsValue } from "nexus/dist/core";
import { isNonNullish } from "remeda";
import { NexusGenInputs } from "../__types";
import { ArgValidationError } from "../helpers/errors";
import { validateAnd } from "../helpers/validateArgs";
import { validPetitionSharedWithFilter, validPetitionTagFilter } from "../petition/types/filters";

export function validPetitionListViewData<TypeName extends string, FieldName extends string>(
  prop: (
    args: ArgsValue<TypeName, FieldName>,
  ) => NexusGenInputs["PetitionListViewDataInput"] | null | undefined,
  name: string,
) {
  return validateAnd<TypeName, FieldName>(
    validPetitionSharedWithFilter((args) => prop(args)?.sharedWith, `${name}.sharedWith`),
    validPetitionTagFilter((args) => prop(args)?.tagsFilters, `${name}.tagsFilters`),
    async (_, args, ctx, info) => {
      const fromTemplateId = prop(args)?.fromTemplateId;
      if (isNonNullish(fromTemplateId)) {
        const hasAccess = await ctx.petitions.userHasAccessToPetitions(
          ctx.user!.id,
          fromTemplateId,
        );
        if (!hasAccess) {
          throw new ArgValidationError(info, `${name}.fromTemplateId`, "Invalid template ID");
        }
      }
    },
  );
}
