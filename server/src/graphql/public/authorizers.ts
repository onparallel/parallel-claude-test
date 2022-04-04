import { ApolloError } from "apollo-server-core";
import { parse as parseCookie } from "cookie";
import { IncomingMessage } from "http";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { countBy, isDefined } from "remeda";
import { unMaybeArray } from "../../util/arrays";
import { toGlobalId } from "../../util/globalId";
import { verify } from "../../util/jwt";
import { MaybeArray } from "../../util/types";
import { Arg, chain } from "../helpers/authorize";
import { PublicPetitionNotAvailableError } from "../helpers/errors";

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
    const contactId = ctx.contact!.id;
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
        ctx.contacts.loadContact(access.contact_id),
        ctx.petitions.loadPetition(access.petition_id),
      ]);
      if (!petition) {
        throw new PublicPetitionNotAvailableError(
          `Petition for petition access with keycode ${keycode} not found`
        );
      }
      if (!contact) {
        throw new PublicPetitionNotAvailableError(
          `Contact for petition access with keycode ${keycode} not found`
        );
      } else {
        ctx.contact = contact;
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
    return true;
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

export function validPublicPetitionLink<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argPublicPetitionLinkId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const id = args[argPublicPetitionLinkId] as unknown as number;

    const publicPetitionLink = await ctx.petitions.loadPublicPetitionLink(id);

    if (!isDefined(publicPetitionLink) || !publicPetitionLink.is_active) {
      return false;
    }

    const [petition, fields] = await Promise.all([
      ctx.petitions.loadPetition(publicPetitionLink.template_id),
      ctx.petitions.loadFieldsForPetition(publicPetitionLink.template_id),
    ]);

    // petition exists and is of type template
    if (!petition || !petition.is_template) {
      return false;
    }

    // template has repliable fields
    if (countBy(fields, (f) => f.type !== "HEADING") === 0) {
      return false;
    }

    // every repliable field has a title
    if (fields.find((f) => f.type !== "HEADING" && !isDefined(f.title))) {
      return false;
    }
    return true;
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
