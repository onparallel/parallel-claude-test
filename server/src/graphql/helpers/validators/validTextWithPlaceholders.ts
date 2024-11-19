import { GraphQLResolveInfo } from "graphql";
import { core } from "nexus";
import pMap from "p-map";
import { isNonNullish, unique } from "remeda";
import { discriminator } from "../../../util/discriminator";
import { fromGlobalId } from "../../../util/globalId";
import { parseTextWithPlaceholders } from "../../../util/slate/placeholders";
import { MaybePromise } from "../../../util/types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";

export function validPetitionSubject<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
  petitionIdProp: ArgWithPath<TypeName, FieldName, number>,
) {
  return validTextWithPlaceholders(prop, async (placeholder, args, ctx, info) => {
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
    const [, argName] = getArgWithPath(args, prop);
    try {
      const field = await ctx.petitions.loadField(fromGlobalId(placeholder, "PetitionField").id);
      const [petitionId] = getArgWithPath(args, petitionIdProp);
      if (isNonNullish(field) && field.petition_id !== petitionId) {
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
>(prop: ArgWithPath<TypeName, FieldName, string | null | undefined>) {
  return validTextWithPlaceholders(prop, (placeholder) =>
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
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
) {
  return validTextWithPlaceholders(prop, (placeholder) =>
    ["field-number", "field-title", "file-name"].includes(placeholder),
  );
}

function validTextWithPlaceholders<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, string | null | undefined>,
  validPlaceholder: (
    placeholder: string,
    args: core.ArgsValue<TypeName, FieldName>,
    context: core.GetGen<"context">,
    info: GraphQLResolveInfo,
  ) => MaybePromise<boolean>,
) {
  return (async (_, args, context, info) => {
    const [value, argName] = getArgWithPath(args, prop);
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
