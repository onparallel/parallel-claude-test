import { GraphQLResolveInfo } from "graphql";
import { core } from "nexus";
import pMap from "p-map";
import { isDefined, unique } from "remeda";
import { discriminator } from "../../../util/discriminator";
import { fromGlobalId } from "../../../util/globalId";
import { parseTextWithPlaceholders } from "../../../util/slate/placeholders";
import { MaybePromise } from "../../../util/types";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validPetitionSubject<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  petitionIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  argName: string,
) {
  return validTextWithPlaceholders(prop, argName, async (placeholder, args, ctx, info) => {
    if (
      [
        "petition-title",
        "contact-first-name",
        "contact-last-name",
        "contact-full-name",
        "contact-email",
        "user-first-name",
        "user-last-name",
        "user-full-name",
      ].includes(placeholder)
    ) {
      return true;
    }
    try {
      const field = await ctx.petitions.loadField(fromGlobalId(placeholder, "PetitionField").id);
      const petitionId = petitionIdProp(args);
      if (isDefined(field) && field.petition_id !== petitionId) {
        throw new ArgValidationError(info, argName, `PetitionField does not belong to Petition`);
      }
      return true;
    } catch (e) {
      if (e instanceof ArgValidationError) {
        throw e;
      }
      throw new ArgValidationError(info, argName, `Expected ${placeholder} to be a PetitionField`);
    }
  });
}

export function validPublicPetitionLinkPetitionNamePattern<
  TypeName extends string,
  FieldName extends string,
>(prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined, argName: string) {
  return validTextWithPlaceholders(prop, argName, (placeholder) =>
    [
      "petition-title",
      "contact-full-name",
      "contact-first-name",
      "contact-last-name",
      "contact-email",
    ].includes(placeholder),
  );
}

export function validExportFileRenamePattern<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
) {
  return validTextWithPlaceholders(prop, argName, (placeholder) =>
    ["field-number", "field-title", "file-name"].includes(placeholder),
  );
}

export function validTextWithPlaceholders<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
  validPlaceholder: (
    placeholder: string,
    args: core.ArgsValue<TypeName, FieldName>,
    context: core.GetGen<"context">,
    info: GraphQLResolveInfo,
  ) => MaybePromise<boolean>,
) {
  return (async (_, args, context, info) => {
    const value = prop(args);
    if (!value) {
      return;
    }

    const placeholders = unique(
      parseTextWithPlaceholders(value).filter(discriminator("type", "placeholder" as const)),
    );
    const invalid = (
      await pMap(
        placeholders,
        async (placeholder) =>
          [
            placeholder.value,
            await validPlaceholder(placeholder.value, args, context, info),
          ] as const,
      )
    ).filter(([, valid]) => !valid);
    if (invalid.length) {
      throw new ArgValidationError(
        info,
        argName,
        `Invalid placeholders used: ${invalid.map(([x]) => x).join(", ")}`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
