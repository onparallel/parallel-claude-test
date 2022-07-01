import { ApolloError } from "apollo-server-express";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { countBy, isDefined, uniq } from "remeda";
import {
  FeatureFlagName,
  IntegrationType,
  PetitionFieldType,
  PetitionPermissionType,
} from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { Arg } from "../helpers/authorize";

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argName: TArg,
  permissionTypes?: PetitionPermissionType[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      if (petitionIds.length === 0) {
        return true;
      }
      return await ctx.petitions.userHasAccessToPetitions(
        ctx.user!.id,
        petitionIds,
        permissionTypes
      );
    } catch {}
    return false;
  };
}

export function userHasAccessToSignatureRequest<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argName: TArg,
  permissionTypes?: PetitionPermissionType[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const signatureRequestIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      if (signatureRequestIds.length === 0) {
        return true;
      }
      const signatureRequests = await ctx.petitions.loadPetitionSignatureById(signatureRequestIds);
      if (signatureRequests.some((s) => !isDefined(s))) {
        return false;
      }

      return await ctx.petitions.userHasAccessToPetitions(
        ctx.user!.id,
        uniq(signatureRequests.map((s) => s!.petition_id)),
        permissionTypes
      );
    } catch {}
    return false;
  };
}

export function userHasAccessToPetitionFieldComments<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const commentIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      if (commentIds.length === 0) {
        return true;
      }
      return await ctx.petitions.userHasAccessToPetitionFieldComments(ctx.user!.id, commentIds);
    } catch {}
    return false;
  };
}

export function petitionsArePublicTemplates<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number | number[]>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const templateIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      return await ctx.petitions.arePublicTemplates(templateIds);
    } catch {}
    return false;
  };
}

export function petitionsAreOfTypePetition<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      const petitions = await ctx.petitions.loadPetition(petitionIds);
      return petitions.every((p) => p && !p.is_template);
    } catch {}
    return false;
  };
}

export function petitionsAreOfTypeTemplate<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      const petitions = await ctx.petitions.loadPetition(petitionIds);
      return petitions.every((p) => p && p.is_template);
    } catch {}
    return false;
  };
}

export function fieldIsNotFixed<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argNameFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const field = await ctx.petitions.loadField(args[argNameFieldId] as unknown as number);
      return !field!.is_fixed;
    } catch {}
    return false;
  };
}

export function fieldsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNamePetitionId: TArg1, argNameFieldIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.fieldsBelongToPetition(
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameFieldIds] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function fieldsHaveCommentsEnabled<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameFieldIds: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(args[argNameFieldIds] as unknown as MaybeArray<number>);
      return await ctx.petitions.fieldsHaveCommentsEnabled(ids);
    } catch {}
    return false;
  };
}

export function fieldsAreNotInternal<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameFieldIds: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(args[argNameFieldIds] as unknown as MaybeArray<number>);
      return await ctx.petitions.fieldsAreNotInternal(ids);
    } catch {}
    return false;
  };
}

export function fieldCanBeReplied<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(fieldIdArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldId = args[fieldIdArg] as unknown as number;
    const [field, replies] = await Promise.all([
      ctx.petitions.loadField(fieldId),
      ctx.petitions.loadRepliesForField(fieldId),
    ]);

    if (!field || (!field.multiple && replies.length > 0)) {
      throw new ApolloError(
        "The field is already replied and does not accept multiple replies",
        "FIELD_ALREADY_REPLIED_ERROR"
      );
    }

    return true;
  };
}

export function fieldHasType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(
  argFieldId: TArg,
  fieldType: MaybeArray<PetitionFieldType>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldId = args[argFieldId] as unknown as number;
    const field = (await ctx.petitions.loadField(fieldId))!;
    const validFieldTypes = unMaybeArray(fieldType);

    if (!validFieldTypes.includes(field.type)) {
      throw new ApolloError(
        `Expected ${validFieldTypes.join(" or ")}, got ${field.type}`,
        "INVALID_FIELD_TYPE_ERROR"
      );
    }

    return true;
  };
}

export function replyIsForFieldOfType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(
  argReplyId: TArg,
  fieldType: MaybeArray<PetitionFieldType>
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const field = (await ctx.petitions.loadFieldForReply(args[argReplyId] as unknown as number))!;
    const validFieldTypes = unMaybeArray(fieldType);

    if (!validFieldTypes.includes(field.type)) {
      throw new ApolloError(
        `Expected ${validFieldTypes.join(" or ")}, got ${field.type}`,
        "INVALID_FIELD_TYPE_ERROR"
      );
    }

    return true;
  };
}

export function fieldAttachmentBelongsToField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameFieldId: TArg1, argNameAttachmentId: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.fieldAttachmentBelongsToField(
        args[argNameFieldId] as unknown as number,
        unMaybeArray(args[argNameAttachmentId] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function petitionAttachmentBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(
  argNamePetitionId: TArg1,
  argNameAttachmentId: TArg2
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.petitionAttachmentBelongsToPetition(
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameAttachmentId] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function repliesBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNamePetitionId: TArg1, argNameReplyIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.repliesBelongsToPetition(
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameReplyIds] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function repliesBelongsToField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameFieldId: TArg1, argNameReplyIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.repliesBelongsToField(
        args[argNameFieldId] as unknown as number,
        unMaybeArray(args[argNameReplyIds] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function accessesBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNamePetitionId: TArg1, argNameAccessIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.accessesBelongToPetition(
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameAccessIds] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function messageBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, number>
>(argNamePetitionId: TArg1, argNameMessageId: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.messagesBelongToPetition(
        args[argNamePetitionId] as unknown as number,
        [args[argNameMessageId] as unknown as number]
      );
    } catch {}
    return false;
  };
}

export function commentsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNamePetitionId: TArg1, argNameCommentIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.commentsBelongToPetition(
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameCommentIds] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function accessesBelongToValidContacts<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNameAccessIds: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.accessesBelongToValidContacts(
        unMaybeArray(args[argNameAccessIds] as unknown as MaybeArray<number>)
      );
    } catch {}
    return false;
  };
}

export function userHasFeatureFlag<TypeName extends string, FieldName extends string>(
  feature: FeatureFlagName
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, feature);
    } catch {}
    return false;
  };
}

export function petitionHasRepliableFields<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argNamePetitionId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionId = args[argNamePetitionId] as unknown as number;
      const fields = await ctx.petitions.loadFieldsForPetition(petitionId);

      if (countBy(fields, (f) => f.type !== "HEADING") === 0) {
        return false;
      }

      return true;
    } catch {}
    return false;
  };
}

export function petitionsAreEditable<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNamePetitionIds: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitions = await ctx.petitions.loadPetition(
        unMaybeArray(args[argNamePetitionIds] as unknown as MaybeArray<number>)
      );
      return petitions.every((p) => isDefined(p) && !p.restricted_by_user_id);
    } catch {}
    return false;
  };
}

export function petitionsAreNotPublicTemplates<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>
>(argNamePetitionIds: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitions = await ctx.petitions.loadPetition(
        unMaybeArray(args[argNamePetitionIds] as unknown as MaybeArray<number>)
      );
      return petitions.every((p) => isDefined(p) && !p.template_public);
    } catch {}
    return false;
  };
}

export function templateDoesNotHavePublicPetitionLink<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const publicLinks = await ctx.petitions.loadPublicPetitionLinksByTemplateId(
        args[argName] as unknown as number
      );
      return publicLinks.length === 0;
    } catch {}
    return false;
  };
}

export function userHasEnabledIntegration<TypeName extends string, FieldName extends string>(
  type: IntegrationType
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const integrations = await ctx.integrations.loadIntegrationsByOrgId(ctx.user!.org_id, type);
      return integrations.length > 0;
    } catch {}
    return false;
  };
}

export function replyCanBeUpdated<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argReplyId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyId = args[argReplyId] as unknown as number;

    const reply = await ctx.petitions.loadFieldReply(replyId);
    if (!reply) {
      // field or reply could be already deleted, throw FORBIDDEN error
      return false;
    }

    if (reply.status === "APPROVED" || reply.anonymized_at !== null) {
      throw new ApolloError(
        `The reply has been approved and cannot be updated.`,
        "REPLY_ALREADY_APPROVED_ERROR"
      );
    }

    return true;
  };
}

export function petitionIsNotAnonymized<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argPetitionId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petition = await ctx.petitions.loadPetition(args[argPetitionId] as unknown as number);
    return petition?.anonymized_at === null;
  };
}

export function signatureRequestIsNotAnonymized<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>
>(argSignatureRequestId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(
      args[argSignatureRequestId] as unknown as number
    );
    return signature?.anonymized_at === null;
  };
}
