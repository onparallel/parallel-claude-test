import { parse as parseCookie } from "cookie";
import { IncomingMessage } from "http";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish, isNullish, unique } from "remeda";
import { assert } from "ts-essentials";
import { FeatureFlagName } from "../../db/__types";
import { toGlobalId } from "../../util/globalId";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { Arg, chain, getArg } from "../helpers/authorize";
import { ApolloError, ForbiddenError } from "../helpers/errors";

export function authenticatePublicAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return chain(fetchPetitionAccess(argKeycode), async function (_, args, ctx) {
    const petition = (await ctx.petitions.loadPetition(ctx.access!.petition_id))!;
    if (petition.anonymized_at !== null) {
      throw new ForbiddenError("Petition is anonymized");
    }
    if (petition.enable_interaction_with_recipients === false) {
      throw new ForbiddenError("Petition does not allow interaction with recipients");
    }

    if (petition.skip_forward_security) {
      return true;
    }
    const contactId = ctx.contact?.id;
    if (isNullish(contactId)) {
      throw new ApolloError("Contact not found", "CONTACT_NOT_FOUND");
    }
    const cookieValue = getContactAuthCookieValue(ctx.req, contactId);
    if (
      cookieValue &&
      (await ctx.contacts.loadContactAuthenticationByContactId({ contactId, cookieValue }))
    ) {
      return true;
    } else {
      throw new ApolloError("Contact is not verified", "CONTACT_NOT_VERIFIED");
    }
  });
}

export function publicPetitionIsNotClosed<
  TypeName extends string,
  FieldName extends string,
>(): FieldAuthorizeResolver<TypeName, FieldName> {
  return async function (_, args, ctx) {
    const petition = (await ctx.petitions.loadPetition(ctx.access!.petition_id))!;
    if (petition.status === "CLOSED") {
      throw new ForbiddenError("Petition is closed");
    }

    return true;
  };
}

export function getContactAuthCookieValue(
  req: IncomingMessage,
  contactId: number,
): string | undefined {
  const cookies = parseCookie(req.headers["cookie"] ?? "");
  const cookieName = `parallel_contact_auth_${toGlobalId("Contact", contactId)}`;
  return cookies[cookieName];
}

export function fetchPetitionAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const keycode = getArg(args, argKeycode);
    const access = await ctx.petitions.loadAccessByKeycode(keycode);
    if (!access) {
      throw new ApolloError(
        `Petition access with keycode ${keycode} not found`,
        "PUBLIC_PETITION_NOT_AVAILABLE",
      );
    } else if (access.status !== "ACTIVE") {
      throw new ApolloError(
        `Petition access with keycode ${keycode} not active`,
        "PUBLIC_PETITION_NOT_AVAILABLE",
      );
    } else {
      ctx.access = access;
      ctx.trails["accessId"] = access?.id;
      const [contact, petition] = await Promise.all([
        access.contact_id ? ctx.contacts.loadContact(access.contact_id) : null,
        ctx.petitions.loadPetition(access.petition_id),
      ]);
      ctx.contact = contact;

      if (!petition || petition.deletion_scheduled_at !== null) {
        throw new ApolloError(
          `Petition for petition access with keycode ${keycode} not found`,
          "PUBLIC_PETITION_NOT_AVAILABLE",
        );
      }
    }
    return true;
  };
}

export function fieldBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = unique(unMaybeArray(getArg(args, argFieldId)));
    const passes = await ctx.petitions.fieldsBelongToPetition(ctx.access!.petition_id, fieldIds);
    if (!passes) {
      throw new ForbiddenError("Field does not belong to access");
    }
    return true;
  };
}

export function fieldIsExternal<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = unique(unMaybeArray(getArg(args, argFieldId)));

    const fields = await ctx.petitions.loadField(fieldIds);
    if (!fields.every((field) => field?.is_internal === false)) {
      throw new ForbiddenError("Field is not external");
    }

    return true;
  };
}

export function replyBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argReplyId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyIds = unique(unMaybeArray(getArg(args, argReplyId)));
    if (replyIds.length === 0) {
      return true;
    }
    const passes = await ctx.petitions.repliesBelongsToPetition(ctx.access!.petition_id, replyIds);
    if (!passes) {
      throw new ForbiddenError("Reply does not belong to access");
    }
    return true;
  };
}

export function replyBelongsToExternalField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argReplyId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyIds = unique(unMaybeArray(getArg(args, argReplyId)));
    const fields = await ctx.petitions.loadFieldForReply(replyIds);
    if (!fields.every((f) => f?.is_internal === false)) {
      throw new ForbiddenError("Reply does not belong to external field");
    }

    return true;
  };
}

export function commentsBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argCommentId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const passes = await ctx.petitions.commentsBelongToPetition(
      ctx.access!.petition_id,
      unMaybeArray(getArg(args, argCommentId)),
    );
    if (!passes) {
      throw new ForbiddenError("Comment does not belong to access");
    }
    return true;
  };
}

export function validPublicPetitionLinkSlug<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(argSlug: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const slug = getArg(args, argSlug);
    const publicPetitionLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
    if (isNullish(publicPetitionLink) || !publicPetitionLink.is_active) {
      throw new ForbiddenError("Public link not found or inactive");
    }
    const template = await ctx.petitions.loadPetition(publicPetitionLink.template_id);

    if (isNullish(template)) {
      throw new ForbiddenError("Template not found");
    }

    if (!template.is_template) {
      throw new ForbiddenError("Template is not a template");
    }

    if (template.anonymized_at !== null) {
      throw new ForbiddenError("Template is anonymized");
    }

    if (!template.enable_interaction_with_recipients) {
      throw new ForbiddenError("Template does not allow interaction with recipients");
    }

    if (template.deletion_scheduled_at !== null) {
      throw new ForbiddenError("Template is scheduled for deletion");
    }

    return true;
  };
}

export function validPublicPetitionLinkPrefill<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, string>,
  TArg2 extends Arg<TypeName, FieldName, string>,
>(argPrefill: TArg1, argSlug: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const slug = getArg(args, argSlug);
      const prefill = getArg(args, argPrefill);
      const publicLink = await ctx.petitions.loadPublicPetitionLinkBySlug(slug);
      if (isNonNullish(publicLink?.prefill_secret)) {
        await ctx.jwt.verify(prefill!, { secret: publicLink!.prefill_secret });
        return true;
      }
    } catch {}
    throw new ForbiddenError("Public link prefill is not valid");
  };
}

export function validPublicPetitionLinkPrefillDataKeycode<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, string>,
>(argKeycode: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const keycode = getArg(args, argKeycode);
    const publicPrefillData =
      await ctx.petitions.loadPublicPetitionLinkPrefillDataByKeycode(keycode);
    if (!publicPrefillData) {
      throw new ForbiddenError("Public prefill data not found");
    }

    const template = await ctx.petitions.loadPetition(publicPrefillData.template_id);

    if (!template || !template.is_template) {
      throw new ForbiddenError("Template not found or not a template");
    }

    return true;
  };
}

export function taskBelongsToAccess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(taskIdArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const passes = await ctx.tasks.taskBelongsToAccess(getArg(args, taskIdArg), ctx.access!.id);
    if (!passes) {
      throw new ForbiddenError("Task does not belong to access");
    }
    return true;
  };
}

export function organizationHasFeatureFlag<TypeName extends string, FieldName extends string>(
  name: FeatureFlagName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petition = (await ctx.petitions.loadPetition(ctx.access!.petition_id))!;
    const hasFF = await ctx.featureFlags.orgHasFeatureFlag(petition.org_id, name);
    if (!hasFF) {
      throw new ForbiddenError("Feature flag not found");
    }

    return true;
  };
}

export function publicPetitionDoesNotHaveOngoingProcess<
  TypeName extends string,
  FieldName extends string,
  TKeycodeArg extends Arg<TypeName, FieldName, string>,
>(keycodeArg: TKeycodeArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const keycode = getArg(args, keycodeArg);

    const access = await ctx.petitions.loadAccessByKeycode(keycode);
    assert(access, "Access not found");
    const petitionId = access.petition_id;

    const [processType] = await ctx.petitions.getPetitionStartedProcesses(petitionId);

    if (isNonNullish(processType)) {
      throw new ApolloError(
        `Petition has an ongoing ${processType.toLowerCase()} process`,
        `ONGOING_PROCESS_ERROR`,
        { processType },
      );
    }
    return true;
  };
}
