import { GraphQLResolveInfo } from "graphql";
import { core } from "nexus";
import { ArgsValue } from "nexus/dist/core";
import { groupBy, indexBy, isDefined, mapValues, pipe, uniq } from "remeda";
import { ApiContext } from "../../context";
import { PetitionField } from "../../db/__types";
import { fromGlobalId, toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { ValidateReplyContentError, validateReplyContent } from "../../util/validateReplyContent";
import { NexusGenInputs } from "../__types";
import { ArgValidationError, InvalidReplyError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";
import { keyBuilder } from "../../util/keyBuilder";

export function validatePublicPetitionLinkSlug<TypeName extends string, FieldName extends string>(
  slugArg: (args: ArgsValue<TypeName, FieldName>) => string | null | undefined,
  argName: string,
  publicPetitionLinkIdArg?: (args: ArgsValue<TypeName, FieldName>) => number,
) {
  const MIN_SLUG_LENGTH = 8;
  const MAX_SLUG_LENGTH = 30;

  return (async (_, args, ctx, info) => {
    const slug = slugArg(args);
    if (!slug) {
      return;
    }

    const publicPetitionLinkId = publicPetitionLinkIdArg?.(args);

    if (slug.length < MIN_SLUG_LENGTH) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't have less than ${MIN_SLUG_LENGTH} characters.`,
        { code: "MIN_SLUG_LENGTH_VALIDATION_ERROR" },
      );
    }
    if (slug.length > MAX_SLUG_LENGTH) {
      throw new ArgValidationError(
        info,
        argName,
        `Value can't have more than ${MAX_SLUG_LENGTH} characters.`,
        { code: "MAX_SLUG_LENGTH_VALIDATION_ERROR" },
      );
    }
    if (!slug.match(/^[a-zA-Z0-9-]*$/)) {
      throw new ArgValidationError(info, argName, `Slug must match /^[a-zA-Z0-9-]*$/`, {
        code: "INVALID_SLUG_CHARS_VALIDATION_ERROR",
      });
    }

    const publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    if (publicLink && publicLink.id !== publicPetitionLinkId) {
      throw new ArgValidationError(
        info,
        argName,
        "Slug is already being used on another public link",
        { code: "SLUG_ALREADY_TAKEN_VALIDATION_ERROR" },
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateCreatePetitionFieldReplyInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>,
  ) => NexusGenInputs["CreatePetitionFieldReplyInput"][],
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    const fieldReplies = prop(args);
    await validateCreateReplyInput(fieldReplies, argName, ctx, info);

    const fields = (await ctx.petitions.loadField(
      fieldReplies.map((fr) => fr.id),
    )) as PetitionField[];

    const fieldsById = indexBy(fields, (f) => f.id);
    for (const [index, reply] of fieldReplies.entries()) {
      const field = fieldsById[reply.id];
      try {
        await validateReplyContent(field, reply.content);
      } catch (e) {
        if (e instanceof ValidateReplyContentError) {
          throw new InvalidReplyError(info, argName + `[${index}].content`, e.message, {
            subcode: e.code,
          });
        } else {
          throw e;
        }
      }
      // for FILE replies, we need to make sure the user has access to the provided reply
      if (isFileTypeField(field.type)) {
        const { id: replyId } = fromGlobalId(
          reply.content.petitionFieldReplyId as string,
          "PetitionFieldReply",
        );
        const petitionFieldReply = await ctx.petitions.loadFieldReply(replyId);

        const isValid =
          isDefined(petitionFieldReply) &&
          ((field.type === "FILE_UPLOAD" &&
            ["FILE_UPLOAD", "ES_TAX_DOCUMENTS"].includes(petitionFieldReply.type)) ||
            field.type === petitionFieldReply.type);

        const hasAccess =
          isValid &&
          isDefined(ctx.user) &&
          (await ctx.petitions.userHasAccessToPetitionFieldReply(
            petitionFieldReply.id,
            ctx.user.id,
          ));

        if (!hasAccess) {
          throw new InvalidReplyError(
            info,
            argName + `[${index}].content.petitionFieldReplyId`,
            `PetitionFieldReply ID is invalid`,
          );
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateUpdatePetitionFieldReplyInput<
  TypeName extends string,
  FieldName extends string,
>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>,
  ) => NexusGenInputs["UpdatePetitionFieldReplyInput"][],
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    const replyContents = prop(args);
    const replyIds = uniq(replyContents.map((r) => r.id));
    const [fields, replies] = await Promise.all([
      ctx.petitions.loadFieldForReply(replyIds),
      ctx.petitions.loadFieldReply(replyIds),
    ]);

    const byReplyId = groupBy(replyContents, (r) => r.id);
    for (const [replyId, fieldReplies] of Object.entries(byReplyId)) {
      try {
        const reply = replies.find((r) => r!.id === parseInt(replyId));
        const field = fields.find((f) => f!.id === reply!.petition_field_id)!;

        if (!field.multiple && fieldReplies.length > 1) {
          throw new Error(`Can't submit more than one reply on a single reply field`);
        }

        for (const reply of fieldReplies) {
          await validateReplyContent(field, reply.content);
        }
      } catch (error: any) {
        throw new InvalidReplyError(info, argName, error.message, {
          subcode: error.code,
        });
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validateCreateFileReplyInput<TypeName extends string, FieldName extends string>(
  prop: (
    args: core.ArgsValue<TypeName, FieldName>,
  ) => Omit<NexusGenInputs["CreatePetitionFieldReplyInput"], "content">[],
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    await validateCreateReplyInput(prop(args), argName, ctx, info);
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

async function validateCreateReplyInput(
  fieldReplies: Omit<NexusGenInputs["CreatePetitionFieldReplyInput"], "content">[],
  argName: string,
  ctx: ApiContext,
  info: GraphQLResolveInfo,
) {
  const fields = await ctx.petitions.loadField(fieldReplies.map((fr) => fr.id));

  if (!fields.every(isDefined)) {
    const index = fields.findIndex((f) => !isDefined(f));
    throw new InvalidReplyError(
      info,
      argName + `[${index}].id`,
      `Invalid PetitionField ${toGlobalId("PetitionField", fieldReplies[index].id)}`,
    );
  }

  const parentReplyIds = uniq(
    fieldReplies.filter((fr) => isDefined(fr.parentReplyId)).map((fr) => fr.parentReplyId!),
  );
  const parentReplies = await ctx.petitions.loadFieldReply(parentReplyIds);
  if (!parentReplies.every(isDefined)) {
    const index = parentReplies.findIndex((r) => !isDefined(r));
    throw new InvalidReplyError(
      info,
      argName + `[${index}].parentReplyId`,
      `Invalid PetitionFieldReply ${
        isDefined(fieldReplies[index].parentReplyId)
          ? toGlobalId("PetitionFieldReply", fieldReplies[index].parentReplyId!) // use globalIds as this messages are exposed on the API
          : null
      }`,
    );
  }

  for (const fieldReply of fieldReplies) {
    const field = fields.find((f) => f.id === fieldReply.id)!;
    // if replying into a child field, make sure the parentReplyId is passed and references the parent field
    if (isDefined(field.parent_petition_field_id) || isDefined(fieldReply.parentReplyId)) {
      const parentReply = parentReplies.find((r) => r.id === fieldReply.parentReplyId);
      if (
        !isDefined(parentReply) ||
        parentReply.petition_field_id !== field.parent_petition_field_id
      ) {
        const index = fieldReplies.findIndex((r) => r.id === fieldReply.id);
        throw new InvalidReplyError(
          info,
          argName + `[${index}].parentReplyId`,
          `Invalid PetitionFieldReply ${
            isDefined(fieldReply.parentReplyId)
              ? toGlobalId("PetitionFieldReply", fieldReply.parentReplyId!)
              : null
          }`,
        );
      }
    }
  }

  const fieldsByIdParentReplyId = indexBy(
    fieldReplies.map((fr) => ({
      id: fr.id,
      field: fields.find((f) => f.id === fr.id)!,
      parentReplyId: fr.parentReplyId ?? null,
    })),
    keyBuilder(["id", "parentReplyId"]),
  );
  const replyCountByFieldIdParentReplyId = pipe(
    fieldReplies,
    groupBy(keyBuilder(["id", "parentReplyId"])),
    mapValues((r) => r.length),
  );
  // Validate that we are not creating more replies than allowed
  for (const { field, parentReplyId } of Object.values(fieldsByIdParentReplyId)) {
    const key = [field.id, parentReplyId].join(",");
    if (!field.multiple && replyCountByFieldIdParentReplyId[key] > 1) {
      const firstReplyIndex = fieldReplies.findIndex((r) => r.id === field.id);
      const index = fieldReplies.slice(firstReplyIndex + 1).findIndex((r) => r.id === field.id);
      throw new InvalidReplyError(
        info,
        argName + `[${index}].id`,
        `PetitionField ${toGlobalId("PetitionField", field.id)} only accepts one reply`,
      );
    }
  }
}
