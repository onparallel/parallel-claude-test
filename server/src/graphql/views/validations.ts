import { ArgsValue } from "nexus/dist/core";
import { isNonNullish, unique } from "remeda";
import { isGlobalId, toGlobalId } from "../../util/globalId";
import { NexusGenInputs } from "../__types";
import { Arg } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { validateAnd } from "../helpers/validateArgs";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
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

export function validProfileListViewDataInput<
  TypeName extends string,
  FieldName extends string,
  TProfileTypeIdArg extends Arg<TypeName, FieldName, number>,
>(
  profileTypeIdArg: TProfileTypeIdArg,
  prop: (
    args: ArgsValue<TypeName, FieldName>,
  ) => NexusGenInputs["ProfileListViewDataInput"] | null | undefined,
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    const input = prop(args);
    if (!input) {
      return;
    }

    if (unique(input.columns ?? []).length !== (input.columns ?? []).length) {
      throw new ArgValidationError(
        info,
        `${argName}.columns`,
        `Duplicate column values are not allowed`,
      );
    }

    const profileTypeId = args[profileTypeIdArg] as unknown as number;
    const fields = await ctx.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    const validIds = fields.map((f) => toGlobalId("ProfileTypeField", f.id));
    /*
     possible column values are:
     - subscribers
     - createdAt
     - field_xxx (ProfileTypeField globalId)
    */
    for (const column of input.columns ?? []) {
      if (column.startsWith("field_")) {
        const globalId = column.replace("field_", "");
        if (!isGlobalId(globalId, "ProfileTypeField") || !validIds.includes(globalId)) {
          throw new ArgValidationError(
            info,
            `${argName}.columns`,
            `Invalid column value: ${column}`,
          );
        }
      } else if (!["subscribers", "createdAt"].includes(column)) {
        throw new ArgValidationError(info, `${argName}.columns`, `Invalid column value: ${column}`);
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
