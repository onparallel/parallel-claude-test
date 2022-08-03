import Ajv from "ajv";
import { ApolloError } from "apollo-server-core";
import { parse as parseCookie } from "cookie";
import { IncomingMessage } from "http";
import { ArgsValue } from "nexus/dist/core";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isDefined, partition } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { toGlobalId } from "../../util/globalId";
import { verify } from "../../util/jwt";
import { getMentions } from "../../util/slate";
import { MaybeArray } from "../../util/types";
import { Arg, chain } from "../helpers/authorize";
import { ArgValidationError, PublicPetitionNotAvailableError } from "../helpers/errors";

export function authenticatePublicAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return chain(fetchPetitionAccess(argKeycode), async function (_, args, ctx) {
    const petition = (await ctx.petitions.loadPetition(ctx.access!.petition_id))!;
    if (petition.anonymized_at !== null) {
      return false;
    }
    if (petition.skip_forward_security) {
      return true;
    }
    const contactId = ctx.contact?.id;
    if (!isDefined(contactId)) {
      throw new ApolloError("Contact not found", "CONTACT_NOT_FOUND");
    }
    const cookieValue = getContactAuthCookieValue(ctx.req, contactId);
    if (cookieValue && (await ctx.contacts.verifyContact(contactId, cookieValue))) {
      return true;
    } else {
      throw new ApolloError("Contact is not verified", "CONTACT_NOT_VERIFIED");
    }
  });
}

export function getContactAuthCookieValue(
  req: IncomingMessage,
  contactId: number
): string | undefined {
  const cookies = parseCookie(req.headers["cookie"] ?? "");
  const cookieName = `parallel_contact_auth_${toGlobalId("Contact", contactId)}`;
  return cookies[cookieName];
}

export function fetchPetitionAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const keycode = args[argKeycode] as unknown as string;
    const access = await ctx.petitions.loadAccessByKeycode(keycode);
    if (!access) {
      throw new PublicPetitionNotAvailableError(
        `Petition access with keycode ${keycode} not found`
      );
    } else if (access.status !== "ACTIVE") {
      throw new PublicPetitionNotAvailableError(
        `Petition access with keycode ${keycode} not active`
      );
    } else {
      ctx.access = access;
      const [contact, petition] = await Promise.all([
        access.contact_id ? ctx.contacts.loadContact(access.contact_id) : null,
        ctx.petitions.loadPetition(access.petition_id),
      ]);
      ctx.contact = contact;

      if (!petition) {
        throw new PublicPetitionNotAvailableError(
          `Petition for petition access with keycode ${keycode} not found`
        );
      }
    }
    return true;
  };
}

export function fieldBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.fieldsBelongToPetition(ctx.access!.petition_id, [
        args[argFieldId] as unknown as number,
      ]);
    } catch {}
    return false;
  };
}

export function fieldIsExternal<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const fieldId = args[argFieldId] as unknown as number;
      const field = await ctx.petitions.loadField(fieldId);
      return field?.is_internal === false;
    } catch {}
    return false;
  };
}

export function replyBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argReplyId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.repliesBelongsToPetition(ctx.access!.petition_id, [
        args[argReplyId] as unknown as number,
      ]);
    } catch {}
    return false;
  };
}

export function replyBelongsToExternalField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argReplyId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const replyId = args[argReplyId] as unknown as number;
      const field = await ctx.petitions.loadFieldForReply(replyId);
      return field?.is_internal === false;
    } catch {}
    return false;
  };
}

export function commentsBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argCommentId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.commentsBelongToPetition(
        ctx.access!.petition_id,
        unMaybeArray(args[argCommentId] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function validPublicPetitionLinkSlug<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>
>(argSlug: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const slug = args[argSlug] as unknown as string;
    const publicPetitionLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    if (!isDefined(publicPetitionLink) || !publicPetitionLink.is_active) {
      return false;
    }
    const template = await ctx.petitions.loadPetition(publicPetitionLink.template_id);
    return isDefined(template) && template.is_template && template.anonymized_at === null;
  };
}

export function validPublicPetitionLinkPrefill<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string>
>(argPrefill: TArg1, argSlug: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const slug = args[argSlug] as unknown as string;
      const prefill = args[argPrefill] as unknown as string;
      const publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
      if (isDefined(publicLink?.prefill_secret)) {
        await verify(prefill!, publicLink!.prefill_secret, {});
        return true;
      }
    } catch {}
    return false;
  };
}

export function taskBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(taskIdArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.tasks.taskBelongsToAccess(
        args[taskIdArg] as unknown as number,
        ctx.access!.id
      );
    } catch {}
    return false;
  };
}

export function validPetitionFieldCommentContent<
  TypeName extends string,
  FieldName extends string,
  TArgContent extends Arg<TypeName, FieldName, any>,
  TArgFieldId extends Arg<TypeName, FieldName, number>
>(
  argContent: TArgContent,
  argFieldId: TArgFieldId,
  allowMentions?: (args: ArgsValue<TypeName, FieldName>) => boolean | null | undefined
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx, info) => {
    const content = args[argContent] as any;
    const fieldId = args[argFieldId] as unknown as number;
    const canUseMentions = allowMentions?.(args) ?? false;
    const ajv = new Ajv();
    if (!content) {
      return false;
    }
    const valid = ajv.validate(
      {
        definitions: {
          paragraph: {
            type: "object",
            properties: {
              children: { type: "array", items: { $ref: "#/definitions/leaf" } },
              type: { enum: ["paragraph"] },
            },
            required: ["type", "children"],
            additionalProperties: false,
          },
          mention: {
            type: "object",
            properties: {
              type: { const: "mention" },
              mention: { type: "string" },
              children: { type: "array", items: { $ref: "#/definitions/text" } },
            },
            additionalProperties: false,
            required: ["type", "mention", "children"],
          },
          text: {
            type: "object",
            properties: {
              text: { type: "string" },
            },
            additionalProperties: false,
            required: ["text"],
          },
          leaf: {
            type: "object",
            anyOf: [
              ...(canUseMentions ? [{ $ref: "#/definitions/mention" }] : []),
              { $ref: "#/definitions/text" },
            ],
          },
          root: { type: "array", items: { $ref: "#/definitions/paragraph" } },
        },
        $ref: "#/definitions/root",
      },
      content
    );
    if (!valid) {
      throw new ArgValidationError(info, argContent, ajv.errorsText());
    }
    if (canUseMentions) {
      const field = (await ctx.petitions.loadField(fieldId))!;
      const petition = (await ctx.petitions.loadPetition(field.petition_id))!;
      const mentions = getMentions(content);
      const [userMentions, userGroupMentions] = partition(mentions, (m) => m.type === "User");
      return await ctx.petitions.canBeMentionedInPetitionFieldComment(
        petition.org_id,
        userMentions.map((m) => m.id),
        userGroupMentions.map((m) => m.id)
      );
    }
    return true;
  };
}
