import { core } from "nexus";
import { ArgsValue } from "nexus/dist/core";
import { groupBy, isDefined, uniq } from "remeda";
import { fromGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { validateReplyContent } from "../../util/validateReplyContent";
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
    const fields = await ctx.petitions.loadField(uniq(fieldReplies.map((fr) => fr.id)));

    const byFieldId = groupBy(fieldReplies, (r) => r.id);
    for (const [fieldId, fieldReplies] of Object.entries(byFieldId)) {
      try {
        const field = fields.find((f) => f?.id === parseInt(fieldId))!;

        if (!field.multiple && fieldReplies.length > 1) {
          throw new Error(`Can't submit more than one reply on a single reply field`);
        }

        for (const reply of fieldReplies) {
          validateReplyContent(field, reply.content);

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

            if (!isValid) {
              throw new Error(
                `Invalid PetitionFieldReply id ${reply.content.petitionFieldReplyId}`,
              );
            }

            const hasAccess =
              isDefined(ctx.user) &&
              (await ctx.petitions.userhasAccessToPetitionFieldReply(
                petitionFieldReply.id,
                ctx.user.id,
              ));

            if (!hasAccess) {
              throw new Error(
                `User doesn't have access to PetitionFieldReply id ${reply.content.petitionFieldReplyId}`,
              );
            }
          }
        }
      } catch (error: any) {
        throw new InvalidReplyError(info, argName, error.message, {
          subcode: error.code,
        });
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
          validateReplyContent(field, reply.content);
        }
      } catch (error: any) {
        throw new InvalidReplyError(info, argName, error.message, {
          subcode: error.code,
        });
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
