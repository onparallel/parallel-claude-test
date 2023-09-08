import { core } from "nexus";
import { ArgsValue } from "nexus/dist/core";
import { groupBy, indexBy, isDefined, mapValues, pipe, uniq } from "remeda";
import { fromGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { ValidateReplyContentError, validateReplyContent } from "../../util/validateReplyContent";
import { ArgValidationError, InvalidReplyError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

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

export function validateCreateReplyContent<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => { id: number; content?: any }[],
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    const fieldReplies = prop(args);
    const fields = await ctx.petitions.loadField(fieldReplies.map((fr) => fr.id));
    if (!fields.every(isDefined)) {
      const index = fields.findIndex((f) => !isDefined(f));
      throw new InvalidReplyError(
        info,
        argName + `[${index}].id`,
        `Invalid PetitionField ID ${fieldReplies[index].id}`,
      );
    }
    const fieldsById = indexBy(fields, (f) => f.id);
    const replyCountByFieldId = pipe(
      fieldReplies,
      groupBy((r) => r.id),
      mapValues((r) => r.length),
    );
    // Validate that we are not creating more replies than allowed
    for (const field of Object.values(fieldsById)) {
      if (!field.multiple && replyCountByFieldId[field.id] > 1) {
        const firstReplyIndex = fieldReplies.findIndex((r) => r.id === field.id);
        const index = fieldReplies.slice(firstReplyIndex + 1).findIndex((r) => r.id === field.id);
        throw new InvalidReplyError(
          info,
          argName + `[${index}].id`,
          `PetitionField with ID ${field.id} only accepts one reply`,
        );
      }
    }
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
          (await ctx.petitions.userhasAccessToPetitionFieldReply(
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

export function validateUpdateReplyContent<TypeName extends string, FieldName extends string>(
  prop: (args: core.ArgsValue<TypeName, FieldName>) => { id: number; content?: any }[],
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
