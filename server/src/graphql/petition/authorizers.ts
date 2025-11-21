import { core } from "nexus";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { groupBy, indexBy, isNonNullish, isNullish, partition, unique } from "remeda";
import { assert } from "ts-essentials";
import {
  FeatureFlagName,
  IntegrationType,
  Petition,
  PetitionAccess,
  PetitionAccessStatus,
  PetitionAttachmentType,
  PetitionFieldType,
  PetitionPermissionType,
  PetitionSignatureStatus,
  PetitionStatus,
} from "../../db/__types";
import { PetitionFieldLogicCondition } from "../../util/fieldLogic";
import { fromGlobalIds, toGlobalId } from "../../util/globalId";
import { collectMentionsFromSlate } from "../../util/slate/mentions";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { NexusGenInputs } from "../__types";
import { and, Arg, ArgAuthorizer, getArg } from "../helpers/authorize";
import { ApolloError, ForbiddenError } from "../helpers/errors";

function createPetitionAuthorizer<TRest extends any[] = []>(
  predicate: (petition: Petition, ...rest: TRest) => boolean,
  message?: string,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      const petitionIds = unMaybeArray(getArg(args, argName));
      if (petitionIds.length === 0) {
        return true;
      }
      const petitions = await ctx.petitions.loadPetition(petitionIds);
      const result = petitions.every(
        (petition) => isNonNullish(petition) && predicate(petition, ...rest),
      );
      if (!result && isNonNullish(message)) {
        throw new ForbiddenError(message);
      } else {
        return result;
      }
    };
  }) as ArgAuthorizer<MaybeArray<number>, TRest>;
}

function createPetitionAccessAuthorizer<TRest extends any[] = []>(
  predicate: (access: PetitionAccess, ...rest: TRest) => boolean,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      try {
        const accessIds = unMaybeArray(getArg(args, argName));
        if (accessIds.length === 0) {
          return true;
        }
        const accesses = await ctx.petitions.loadAccess(accessIds);
        return accesses.every((access) => isNonNullish(access) && predicate(access, ...rest));
      } catch {}
      return false;
    };
  }) as ArgAuthorizer<MaybeArray<number>, TRest>;
}

export function userHasAccessToPetitions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argName: TArg,
  permissionType?: PetitionPermissionType,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionIds = unMaybeArray(getArg(args, argName));
      if (petitionIds.length === 0) {
        return true;
      }
      if (await ctx.petitions.userHasAccessToPetitions(ctx.user!.id, petitionIds, permissionType)) {
        return true;
      }
    } catch {}
    throw new ForbiddenError("User has no access to petition");
  };
}

export function userHasAccessToSignatureRequest<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argName: TArg,
  permissionType?: PetitionPermissionType,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const signatureRequestIds = unMaybeArray(getArg(args, argName));
      if (signatureRequestIds.length === 0) {
        return true;
      }
      const signatureRequests = await ctx.petitions.loadPetitionSignatureById(signatureRequestIds);
      if (signatureRequests.some((s) => isNullish(s))) {
        return false;
      }

      return await ctx.petitions.userHasAccessToPetitions(
        ctx.user!.id,
        unique(signatureRequests.map((s) => s!.petition_id)),
        permissionType,
      );
    } catch {}
    return false;
  };
}

export const petitionsArePublicTemplates = createPetitionAuthorizer(
  (p) => p.is_template && p.template_public,
  "Petition is not public template",
);

export const petitionsAreNotPublicTemplates = createPetitionAuthorizer(
  (p) => !p.template_public,
  "Petition is public template",
);

export const petitionsAreNotScheduledForDeletion = createPetitionAuthorizer(
  (p) => p.deletion_scheduled_at === null,
  "Petition is scheduled for deletion",
);

export function petitionSignatureRequestIsNotScheduledForDeletion<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
>(argNamePetitionSignatureRequestId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(
      getArg(args, argNamePetitionSignatureRequestId),
    );
    assert(signature);
    const petition = await ctx.petitions.loadPetition(signature.petition_id);

    return petition?.deletion_scheduled_at === null;
  };
}

export const petitionsAreOfTypePetition = createPetitionAuthorizer((p) => !p.is_template);
export const petitionsHaveEnabledInteractionWithRecipients = createPetitionAuthorizer(
  (p) => p.enable_interaction_with_recipients,
);
export const petitionsAreOfTypeTemplate = createPetitionAuthorizer(
  (p) => p.is_template,
  "Petition is not a template",
);

export function fieldIsNotFixed<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
>(argNameFieldId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const field = await ctx.petitions.loadField(getArg(args, argNameFieldId));
      return !field!.is_fixed;
    } catch {}
    return false;
  };
}

export function fieldsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNamePetitionId: TArg1, argNameFieldIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const fieldIds = unique(unMaybeArray(getArg(args, argNameFieldIds)));

      return await ctx.petitions.fieldsBelongToPetition(getArg(args, argNamePetitionId), fieldIds);
    } catch {}
    return false;
  };
}

export function fieldsHaveCommentsEnabled<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNameFieldIds: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(getArg(args, argNameFieldIds));
      return await ctx.petitions.fieldsHaveCommentsEnabled(ids);
    } catch {}
    return false;
  };
}

export function fieldsAreNotInternal<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNameFieldIds: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const ids = unMaybeArray(getArg(args, argNameFieldIds));
      return await ctx.petitions.fieldsAreNotInternal(ids);
    } catch {}
    return false;
  };
}

export function fieldCanBeReplied<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<{ id: number; parentReplyId?: number | null }>>,
  TOverwrite extends Arg<TypeName, FieldName, boolean | null | undefined>,
>(
  fieldsArg: TArg,
  overWriteArg?: TOverwrite | boolean,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const _fields = unMaybeArray(getArg(args, fieldsArg));

    const overwriteExisting = isNonNullish(overWriteArg)
      ? typeof overWriteArg === "boolean"
        ? overWriteArg
        : (getArg(args, overWriteArg) ?? false)
      : false;

    const canBeReplied = await ctx.petitions.fieldsCanBeReplied(_fields, overwriteExisting);

    if (canBeReplied === "FIELD_ALREADY_REPLIED") {
      throw new ApolloError(
        "The field is already replied and does not accept multiple replies",
        "FIELD_ALREADY_REPLIED_ERROR",
      );
    }
    if (canBeReplied === "REPLY_ONLY_FROM_PROFILE") {
      throw new ApolloError(
        "The field can only be replied to from a profile",
        "REPLY_ONLY_FROM_PROFILE_ERROR",
      );
    }

    return true;
  };
}

export function fieldHasType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argFieldId: TArg,
  fieldType: MaybeArray<PetitionFieldType>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = unique(unMaybeArray(getArg(args, argFieldId)));

    const validFieldTypes = unMaybeArray(fieldType);
    if (!(await ctx.petitions.fieldHasType(fieldIds, validFieldTypes))) {
      throw new ApolloError(
        `Expected fields of type ${validFieldTypes.join(" or ")}`,
        "INVALID_FIELD_TYPE_ERROR",
      );
    }

    return true;
  };
}

export function fieldTypeSwitch<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(
  argFieldId: TArg,
  map: Partial<Record<PetitionFieldType, FieldAuthorizeResolver<TypeName, FieldName>>>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    const fieldId = getArg(args, argFieldId);
    const field = (await ctx.petitions.loadField(fieldId))!;
    const resolver = map[field.type];
    if (!resolver) {
      return true;
    }

    return await resolver(root, args, ctx, info);
  };
}

export function replyTypeSwitch<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(
  argReplyId: TArg,
  map: Partial<Record<PetitionFieldType, FieldAuthorizeResolver<TypeName, FieldName>>>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (root, args, ctx, info) => {
    const replyId = getArg(args, argReplyId);
    const reply = (await ctx.petitions.loadFieldReply(replyId))!;
    const resolver = map[reply.type];
    if (!resolver) {
      return true;
    }

    return await resolver(root, args, ctx, info);
  };
}
export function replyIsForFieldOfType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argReplyId: TArg,
  fieldType: MaybeArray<PetitionFieldType>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyIds = unique(unMaybeArray(getArg(args, argReplyId)));

    const validFieldTypes = unMaybeArray(fieldType);
    if (!(await ctx.petitions.replyIsForFieldOfType(replyIds, validFieldTypes))) {
      throw new ApolloError(
        `Expected replies to be of type ${validFieldTypes.join(" or ")}`,
        "INVALID_FIELD_TYPE_ERROR",
      );
    }

    return true;
  };
}

export function isValidPetitionAttachmentReorder<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, PetitionAttachmentType>,
  TArg3 extends Arg<TypeName, FieldName, number[]>,
>(
  petitionIdArg: TArg1,
  attachmentTypeArg: TArg2,
  attachmentIdsArg: TArg3,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionId = getArg(args, petitionIdArg);
      const type = getArg(args, attachmentTypeArg);
      const attachmentIds = getArg(args, attachmentIdsArg);

      const attachments = (
        await ctx.petitions.loadPetitionAttachmentsByPetitionId(petitionId)
      ).filter((a) => a.type === type);

      // attachmentIds must contain every attachmentId of <type> in the petition
      return (
        attachments.length === attachmentIds.length &&
        attachments.every((a) => attachmentIds.includes(a.id))
      );
    } catch {}
    return false;
  };
}

export function fieldAttachmentBelongsToField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNameFieldId: TArg1, argNameAttachmentId: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.fieldAttachmentBelongsToField(
        getArg(args, argNameFieldId),
        unMaybeArray(getArg(args, argNameAttachmentId)),
      );
    } catch {}
    return false;
  };
}

export function petitionAttachmentBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argNamePetitionId: TArg1,
  argNameAttachmentId: TArg2,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.petitionAttachmentBelongsToPetition(
        getArg(args, argNamePetitionId),
        unMaybeArray(getArg(args, argNameAttachmentId)),
      );
    } catch {}
    return false;
  };
}

export function repliesBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNamePetitionId: TArg1, argNameReplyIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionId = getArg(args, argNamePetitionId);
      const replyIds = unique(unMaybeArray(getArg(args, argNameReplyIds)));

      if (replyIds.length === 0) {
        return true;
      }

      return await ctx.petitions.repliesBelongsToPetition(petitionId, replyIds);
    } catch {}
    return false;
  };
}

export function repliesBelongsToField<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNameFieldId: TArg1, argNameReplyIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.repliesBelongsToField(
        getArg(args, argNameFieldId),
        unMaybeArray(getArg(args, argNameReplyIds)),
      );
    } catch {}
    return false;
  };
}

export function replyStatusCanBeUpdated<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argNameFieldId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const field = (await ctx.petitions.loadField(getArg(args, argNameFieldId)))!;
      return field.require_approval;
    } catch {
      return false;
    }
  };
}

export function accessesBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNamePetitionId: TArg1, argNameAccessIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.accessesBelongToPetition(
        getArg(args, argNamePetitionId),
        unMaybeArray(getArg(args, argNameAccessIds)),
      );
    } catch {}
    return false;
  };
}

export const accessesHaveStatus = createPetitionAccessAuthorizer(
  (access, status: PetitionAccessStatus) => access.status === status,
);

export function accessesHaveRemindersLeft<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNameAccessIds: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const ids = unMaybeArray(getArg(args, argNameAccessIds));
    if (ids.length === 0) {
      return true;
    }
    const accesses = await ctx.petitions.loadAccess(ids);
    const accessWithNoReminders = accesses.find((a) => a?.reminders_left === 0);
    if (accessWithNoReminders) {
      throw new ApolloError(`No reminders left.`, "NO_REMINDERS_LEFT", {
        petitionAccessId: toGlobalId("PetitionAccess", accessWithNoReminders.id),
      });
    }
    return true;
  };
}

export const accessesIsNotOptedOut = createPetitionAccessAuthorizer(
  (access) => !access.reminders_opt_out,
);

export function messageBelongToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, number>,
>(argNamePetitionId: TArg1, argNameMessageId: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.messagesBelongToPetition(getArg(args, argNamePetitionId), [
        getArg(args, argNameMessageId),
      ]);
    } catch {}
    return false;
  };
}

export function commentsBelongsToPetition<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNamePetitionId: TArg1, argNameCommentIds: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.commentsBelongToPetition(
        getArg(args, argNamePetitionId),
        unMaybeArray(getArg(args, argNameCommentIds)),
      );
    } catch {}
    return false;
  };
}

export function accessesBelongToValidContacts<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNameAccessIds: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      return await ctx.petitions.accessesBelongToValidContacts(
        unMaybeArray(getArg(args, argNameAccessIds)),
      );
    } catch {}
    return false;
  };
}

export function userHasFeatureFlag<TypeName extends string, FieldName extends string>(
  feature: FeatureFlagName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const hasFeatureFlag = await ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, feature);
      if (!hasFeatureFlag) {
        throw new ForbiddenError(`missing required feature flags`);
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new ForbiddenError(error.message);
      }
      throw error;
    }
  };
}

export function petitionHasRepliableFields<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argNamePetitionId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionId = getArg(args, argNamePetitionId);
      const fields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);

      const [rootFields, childrenFields] = partition(
        fields,
        (f) => f.parent_petition_field_id === null,
      );

      // at least 1 field with type !== HEADING
      if (rootFields.every((f) => f.type === "HEADING")) {
        return false;
      }

      // every FIELD_GROUP must contain at least 1 child field
      const fieldGroups = rootFields.filter((f) => f.type === "FIELD_GROUP");
      const parentFieldIds = unique(childrenFields.map((f) => f.parent_petition_field_id!));
      if (fieldGroups.some((f) => !parentFieldIds.includes(f.id))) {
        return false;
      }

      return true;
    } catch {}
    return false;
  };
}

export const petitionsAreEditable = createPetitionAuthorizer((petition) =>
  isNullish(petition.restricted_at),
);

export function templateDoesNotHavePublicPetitionLink<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const publicLinks = await ctx.petitions.loadPublicPetitionLinksByTemplateId(
        getArg(args, argName),
      );
      return publicLinks.length === 0;
    } catch {}
    return false;
  };
}

export function userHasEnabledIntegration<TypeName extends string, FieldName extends string>(
  type: IntegrationType,
  onlyValidCredentials?: boolean,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const integrations = await ctx.integrations.loadIntegrationsByOrgId(ctx.user!.org_id, type);

      return (
        integrations.filter(
          (i) => (onlyValidCredentials && !i.invalid_credentials) || !onlyValidCredentials,
        ).length > 0
      );
    } catch {}
    return false;
  };
}

export function replyCanBeUpdated<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argReplyId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyIds = unique(unMaybeArray(getArg(args, argReplyId)));

    const result = await ctx.petitions.repliesCanBeUpdated(replyIds);

    if (result === "REPLY_NOT_FOUND") {
      // field or reply could be already deleted, throw FORBIDDEN error
      return false;
    }

    if (result === "REPLY_ALREADY_APPROVED") {
      throw new ApolloError(
        `The reply has been approved and cannot be updated.`,
        "REPLY_ALREADY_APPROVED_ERROR",
      );
    }

    if (result === "REPLY_ONLY_FROM_PROFILE") {
      throw new ApolloError(
        `The reply can only be updated from a profile`,
        "REPLY_ONLY_FROM_PROFILE_ERROR",
      );
    }

    return true;
  };
}

export function replyCanBeDeleted<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argReplyId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyId = getArg(args, argReplyId);

    const result = await ctx.petitions.replyCanBeDeleted(replyId);
    if (result === "REPLY_ALREADY_DELETED") {
      throw new ApolloError(`Reply is already deleted`, "REPLY_ALREADY_DELETED_ERROR");
    }

    if (result === "CANT_DELETE_FIELD_GROUP_REPLY") {
      throw new ApolloError(
        `You can't delete the last reply of a required FIELD_GROUP field`,
        "DELETE_FIELD_GROUP_REPLY_ERROR",
      );
    }

    return true;
  };
}

export const petitionIsNotAnonymized = createPetitionAuthorizer(
  (petition) => petition.anonymized_at === null,
);

export function petitionCanUploadCustomSignatureDocument<
  TypeName extends string,
  FieldName extends string,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
>(petitionIdArg: TPetitionIdArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petition = await ctx.petitions.loadPetition(getArg(args, petitionIdArg));

    if (!petition?.signature_config?.isEnabled) {
      throw new ApolloError(
        "Petition was expected to have signature_config set",
        "MISSING_SIGNATURE_CONFIG_ERROR",
      );
    }

    if (petition.signature_config.useCustomDocument === false) {
      throw new ApolloError(
        "Petition does not allow custom signature documents",
        "CUSTOM_SIGNATURE_DOCUMENT_NOT_ALLOWED_ERROR",
      );
    }

    return true;
  };
}

export function signatureRequestIsNotAnonymized<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
>(argSignatureRequestId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(
      getArg(args, argSignatureRequestId),
    );
    return signature?.anonymized_at === null;
  };
}

export function signatureRequestHasStatus<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
>(
  argSignatureRequestId: TArg1,
  status: PetitionSignatureStatus[],
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(
      getArg(args, argSignatureRequestId),
    );
    return !!signature && status.includes(signature.status);
  };
}

export const petitionHasStatus = createPetitionAuthorizer(
  (petition, status: MaybeArray<PetitionStatus>) => {
    const statuses = unMaybeArray(status);
    if (petition.is_template) {
      return false;
    }
    if (!statuses.includes(petition.status!)) {
      throw new ApolloError(
        `Expected petition to have status ${statuses.join(" or ")} but got ${petition.status}`,
        "PETITION_STATUS_ERROR",
      );
    }

    return true;
  },
);

export function userHasPermissionInFolders<
  TypeName extends string,
  FieldName extends string,
  TArgIds extends Arg<TypeName, FieldName, MaybeArray<string>>,
  TArgType extends Arg<TypeName, FieldName, core.GetGen2<"allTypes", "PetitionBaseType">>,
>(
  folderIdsArg: TArgIds,
  typeArg: TArgType,
  permissionType: PetitionPermissionType,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const paths = fromGlobalIds(
        unMaybeArray(getArg(args, folderIdsArg)),
        "PetitionFolder",
        true,
      ).ids;
      if (paths.length === 0) {
        return true;
      }

      return await ctx.petitions.userHasPermissionInFolders(
        ctx.user!.id,
        ctx.user!.org_id,
        getArg(args, typeArg) === "TEMPLATE",
        paths,
        permissionType,
      );
    } catch {}
    return false;
  };
}

export function petitionsAreInPath<
  TypeName extends string,
  FieldName extends string,
  TArgIds extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TArgPath extends Arg<TypeName, FieldName, string>,
>(argIds: TArgIds, argPath: TArgPath): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionIds = unMaybeArray(getArg(args, argIds));
      if (petitionIds.length === 0) {
        return true;
      }
      const path = getArg(args, argPath);
      const petitions = await ctx.petitions.loadPetition(petitionIds);
      return petitions.every((p) => isNonNullish(p) && p.path === path);
    } catch {}
    return false;
  };
}

export function foldersAreInPath<
  TypeName extends string,
  FieldName extends string,
  TArgFolderIds extends Arg<TypeName, FieldName, MaybeArray<string>>,
  TArgPath extends Arg<TypeName, FieldName, string>,
>(argFolderIds: TArgFolderIds, argPath: TArgPath): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const folderIds = unMaybeArray(getArg(args, argFolderIds));
      if (folderIds.length === 0) {
        return true;
      }
      const paths = fromGlobalIds(folderIds, "PetitionFolder", true).ids;
      const path = getArg(args, argPath);
      return paths.every((p) => p.startsWith(path) && /^\/[^/]+\/$/.test(p.replace(path, "/")));
    } catch {}
    return false;
  };
}

export function userHasAccessToPetitionFieldComment<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const commentIds = unMaybeArray(getArg(args, argName));
      if (commentIds.length === 0) {
        return true;
      }
      return await ctx.petitions.userHasAccessToPetitionFieldComments(ctx.user!.id, commentIds);
    } catch {}
    return false;
  };
}

export function userIsOwnerOfPetitionFieldComment<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(commentIdArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const commentIds = unMaybeArray(getArg(args, commentIdArg));
    const comments = await ctx.petitions.loadPetitionFieldComment(commentIds);
    if (comments.some((c) => !c || c.user_id !== ctx.user!.id)) {
      return false;
    }

    return true;
  };
}

export function defaultOnBehalfUserBelongsToContextOrganization<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, NexusGenInputs["UpdatePetitionInput"]>,
>(dataArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const data = getArg(args, dataArg);
    const defaultOnBehalfUserId = data.defaultOnBehalfId;
    if (isNullish(defaultOnBehalfUserId)) {
      return true;
    }

    const user = await ctx.users.loadUser(defaultOnBehalfUserId);
    return user?.org_id === ctx.user!.org_id;
  };
}

export function contextUserCanClonePetitions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number[]>,
>(petitionIdsArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionIds = getArg(args, petitionIdsArg);

    const userPermissions = await ctx.users.loadUserPermissions(ctx.user!.id);
    const petitions = await ctx.petitions.loadPetition(petitionIds);
    const [t, p] = partition(petitions, (p) => p!.is_template);

    return (
      (t.length === 0 || userPermissions.includes("PETITIONS:CREATE_TEMPLATES")) &&
      (p.length === 0 || userPermissions.includes("PETITIONS:CREATE_PETITIONS"))
    );
  };
}

export function fieldHasParent<
  TypeName extends string,
  FieldName extends string,
  TArgChildren extends Arg<TypeName, FieldName, MaybeArray<number>>,
  TArgParent extends Arg<TypeName, FieldName, number>,
>(
  childrenFieldIdsArg: TArgChildren,
  parentFieldIdArg?: TArgParent,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const parentFieldId = parentFieldIdArg ? getArg(args, parentFieldIdArg) : null;
    const childrenFieldIds = unMaybeArray(getArg(args, childrenFieldIdsArg));

    if (parentFieldId) {
      const isFieldGroupField = await ctx.petitions.fieldHasType([parentFieldId], ["FIELD_GROUP"]);
      if (!isFieldGroupField) {
        throw new ApolloError(
          `Expected parent field to be of type FIELD_GROUP`,
          "INVALID_FIELD_TYPE_ERROR",
        );
      }
    }

    return await ctx.petitions.fieldHasParent(childrenFieldIds, parentFieldId);
  };
}

export function parentFieldIsInternal<
  TypeName extends string,
  FieldName extends string,
  TArgChildFieldId extends Arg<TypeName, FieldName, number>,
>(childFieldIdArg: TArgChildFieldId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const childId = getArg(args, childFieldIdArg);
    const field = await ctx.petitions.loadField(childId);
    const parent = await ctx.petitions.loadField(field!.parent_petition_field_id!);

    return parent?.is_internal ?? false;
  };
}

export function fieldIsNotFirstChild<
  TypeName extends string,
  FieldName extends string,
  TArgChild extends Arg<TypeName, FieldName, number>,
>(childFieldIdArg: TArgChild): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const childFieldId = getArg(args, childFieldIdArg);

    const field = (await ctx.petitions.loadField(childFieldId))!;

    return field.parent_petition_field_id === null || field.position !== 0;
  };
}

export function firstChildHasType<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArg extends Arg<TypeName, FieldName, number>,
>(
  argPetitionId: TArgPetitionId,
  argFieldId: TArg,
  fieldType: MaybeArray<PetitionFieldType>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, argPetitionId);
    const fieldId = getArg(args, argFieldId);
    const [firstChild] = await ctx.petitions.loadPetitionFieldChildren({
      petitionId,
      parentFieldId: fieldId,
    });
    const validFieldTypes = unMaybeArray(fieldType);

    return isNonNullish(firstChild) && validFieldTypes.includes(firstChild.type);
  };
}

function fieldIsNotReferencedInFieldLogic<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  petitionIdArg: TArgPetitionId,
  fieldIdArg: TArgFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const ids = unMaybeArray(getArg(args, fieldIdArg));

    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);
    const targetFields = petitionFields.filter((f) => ids.includes(f.id));

    const targetChildrenFields = targetFields.flatMap((target) => {
      if (target.type === "FIELD_GROUP") {
        return petitionFields.filter((f) => f.parent_petition_field_id === target.id);
      }
      return [];
    });

    const fieldIds = [...targetFields.map((f) => f.id), ...targetChildrenFields.map((c) => c.id)];

    const referencingFields = petitionFields.filter(
      (f) =>
        (isNullish(f.parent_petition_field_id) ||
          !targetFields.map((f) => f.id).includes(f.parent_petition_field_id)) && // filter children of target fields
        (f.visibility?.conditions.some((c) => "fieldId" in c && fieldIds.includes(c.fieldId)) ||
          f.math?.some(
            (math) =>
              math.conditions.some(
                (c) =>
                  "fieldId" in c &&
                  fieldIds.includes(c.fieldId) &&
                  // field could reference itself in math operations, so exclude it
                  c.fieldId !== f.id,
              ) ||
              math.operations.some(
                (op) =>
                  op.operand.type === "FIELD" &&
                  fieldIds.includes(op.operand.fieldId) &&
                  op.operand.fieldId !== f.id,
              ),
          )),
    );

    if (referencingFields.length > 0) {
      throw new ApolloError(
        "The petition field is being referenced in another field.",
        "FIELD_IS_REFERENCED_ERROR",
        {
          referencingFieldIds: referencingFields.map((f) => toGlobalId("PetitionField", f.id)),
        },
      );
    }

    return true;
  };
}

export function fieldAliasIsAvailable<
  TypeName extends string,
  FieldName extends string,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
  TAliasArg extends Arg<TypeName, FieldName, string>,
>(petitionIdArg: TPetitionIdArg, aliasArg: TAliasArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const alias = getArg(args, aliasArg);
    const [petitionVariable] = await ctx.petitions.getPetitionVariables(petitionId, alias);

    if (petitionVariable) {
      throw new ApolloError(`Alias is being used as petition variable`, "ALIAS_ALREADY_EXISTS");
    }

    return true;
  };
}

export function fieldCanBeLinkedToProfileType<
  TypeName extends string,
  FieldName extends string,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
  TPetitionFieldIdArg extends Arg<TypeName, FieldName, number>,
>(
  petitionIdArg: TPetitionIdArg,
  petitionFieldIdArg: TPetitionFieldIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const petitionFieldId = getArg(args, petitionFieldIdArg);

    const children = await ctx.petitions.loadPetitionFieldChildren({
      petitionId,
      parentFieldId: petitionFieldId,
    });

    if (!children.every((c) => c.profile_type_field_id === null)) {
      // can't link/update the profile_type_id if any of its children has a profile_type_field_id
      return false;
    }

    const relationships =
      await ctx.petitions.loadPetitionFieldGroupRelationshipsByPetitionId(petitionId);

    if (
      relationships.some(
        (r) =>
          isNonNullish(r) &&
          (r.left_side_petition_field_id === petitionFieldId ||
            r.right_side_petition_field_id === petitionFieldId),
      )
    ) {
      // field must not have any relationship with other fields
      return false;
    }

    return true;
  };
}

export function profileTypeFieldCanBeLinkedToFieldGroup<
  TypeName extends string,
  FieldName extends string,
  TParentFieldId extends Arg<TypeName, FieldName, number>,
  TProfileTypeFieldId extends Arg<TypeName, FieldName, number>,
>(
  parentFieldIdArg: TParentFieldId,
  profileTypeFieldIdArg: TProfileTypeFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const parentFieldId = getArg(args, parentFieldIdArg);
    const profileTypeFieldId = getArg(args, profileTypeFieldIdArg);

    const parentField = (await ctx.petitions.loadField(parentFieldId))!;
    if (isNullish(parentField.profile_type_id)) {
      // first check if the parent field has a profile_type_id
      return false;
    }

    const children = await ctx.petitions.loadPetitionFieldChildren({
      petitionId: parentField.petition_id,
      parentFieldId,
    });
    if (children.some((c) => c.profile_type_field_id === profileTypeFieldId)) {
      // profile_type_field_id can't be repeated on the same parent
      return false;
    }
    const profileTypeField = await ctx.profiles.loadProfileTypeField(profileTypeFieldId);
    if (!profileTypeField || profileTypeField.profile_type_id !== parentField.profile_type_id) {
      // profile types must match
      return false;
    }

    return true;
  };
}

export function fieldIsLinkedToProfileTypeField<
  TypeName extends string,
  FieldName extends string,
  TFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(fieldIdArg: TFieldId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = unMaybeArray(getArg(args, fieldIdArg));

    const fields = await ctx.petitions.loadField(fieldIds);
    return fields.every((f) => isNonNullish(f) && f.profile_type_field_id !== null);
  };
}

export function linkedProfileTypeFieldDoesNotHaveFormat<
  TypeName extends string,
  FieldName extends string,
  TFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(fieldIdArg: TFieldId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = unMaybeArray(getArg(args, fieldIdArg));

    const fields = await ctx.petitions.loadField(fieldIds);
    const profileTypeFieldIds = fields.map((f) => f?.profile_type_field_id).filter(isNonNullish);
    const profileTypeFields = await ctx.profiles.loadProfileTypeField(profileTypeFieldIds);
    return profileTypeFields.every((ptf) => isNonNullish(ptf) && isNullish(ptf.options.format));
  };
}

export function fieldIsLinkedToProfileType<
  TypeName extends string,
  FieldName extends string,
  TFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(fieldIdArg: TFieldId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = unMaybeArray(getArg(args, fieldIdArg));

    const fields = await ctx.petitions.loadField(fieldIds);
    return fields.every((f) => isNonNullish(f) && f.profile_type_id !== null);
  };
}

export function petitionFieldsCanBeAssociated<
  TypeName extends string,
  FieldName extends string,
  TRelationshipArg extends Arg<
    TypeName,
    FieldName,
    NexusGenInputs["UpdatePetitionFieldGroupRelationshipInput"][]
  >,
>(relationshipArg: TRelationshipArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const relationships = getArg(args, relationshipArg);

    const relationshipTypes = (
      await ctx.profiles.loadProfileRelationshipType(
        relationships.map((r) => r.profileRelationshipTypeId),
      )
    ).filter(isNonNullish);

    // if both sides have the same fieldId, the relationship must be reciprocal
    if (
      !relationships.every(
        (r) =>
          r.leftSidePetitionFieldId !== r.rightSidePetitionFieldId ||
          relationshipTypes.find((rt) => rt.id === r.profileRelationshipTypeId)?.is_reciprocal,
      )
    ) {
      return false;
    }

    if (
      Object.values(
        groupBy(relationships, (r) => {
          const relationshipType = relationshipTypes.find(
            (rt) => rt.id === r.profileRelationshipTypeId,
          );
          return r.direction === "LEFT_RIGHT" || relationshipType?.is_reciprocal // if relationship is reciprocal, always force the direction to be LEFT_RIGHT
            ? `${r.profileRelationshipTypeId}-${r.leftSidePetitionFieldId}-${r.rightSidePetitionFieldId}`
            : // if direction is RIGHT_LEFT, we need to reorder the fields so we can detect duplicated relationships correctly
              // e.g.: A -> B (LEFT_RIGHT) and B -> A (RIGHT_LEFT) are the exact same relationship
              `${r.profileRelationshipTypeId}-${r.rightSidePetitionFieldId}-${r.leftSidePetitionFieldId}`;
        }),
      ).some((group) => group.length > 1)
    ) {
      // Relationships must be unique
      return false;
    }

    const petitionFields = await ctx.petitions.loadField(
      unique(relationships.flatMap((r) => [r.leftSidePetitionFieldId, r.rightSidePetitionFieldId])),
    );

    if (
      !petitionFields.every(
        (f) => isNonNullish(f) && f.type === "FIELD_GROUP" && isNonNullish(f.profile_type_id),
      )
    ) {
      // every field must be of type FIELD_GROUP and have a defined profile_type_id
      return false;
    }

    const fieldsById = indexBy(petitionFields, (f) => f!.id);

    const invalidRelationships = await ctx.profiles.getInvalidRelationships(
      ctx.user!.org_id,
      relationships.map((r) => ({
        leftSideProfileTypeId:
          r.direction === "LEFT_RIGHT"
            ? fieldsById[r.leftSidePetitionFieldId]!.profile_type_id!
            : fieldsById[r.rightSidePetitionFieldId]!.profile_type_id!,
        rightSideProfileTypeId:
          r.direction === "LEFT_RIGHT"
            ? fieldsById[r.rightSidePetitionFieldId]!.profile_type_id!
            : fieldsById[r.leftSidePetitionFieldId]!.profile_type_id!,
        profileRelationshipTypeId: r.profileRelationshipTypeId,
      })),
    );

    if (invalidRelationships.length > 0) {
      throw new ApolloError(
        "The provided profiles cannot be associated",
        "INVALID_PROFILE_RELATIONSHIP_TYPE_ERROR",
      );
    }
    return true;
  };
}

export function userHasAccessToUpdatePetitionFieldGroupRelationshipsInput<
  TypeName extends string,
  FieldName extends string,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
  TRelationshipsArg extends Arg<
    TypeName,
    FieldName,
    NexusGenInputs["UpdatePetitionFieldGroupRelationshipInput"][]
  >,
>(
  petitionIdArg: TPetitionIdArg,
  relationshipsArg: TRelationshipsArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const relationships = unMaybeArray(getArg(args, relationshipsArg));

    const fieldGroupRelationshipIds = relationships.map((r) => r.id).filter(isNonNullish);
    if (fieldGroupRelationshipIds.length > 0) {
      const fieldGroupRelationships =
        await ctx.petitions.loadPetitionFieldGroupRelationship(fieldGroupRelationshipIds);
      if (!fieldGroupRelationships.every((r) => r?.petition_id === petitionId)) {
        return false;
      }
    }

    const relationshipTypes = await ctx.profiles.loadProfileRelationshipType(
      unique(relationships.map((r) => r.profileRelationshipTypeId)),
    );

    if (!relationshipTypes.every((t) => isNonNullish(t) && t.org_id === ctx.user!.org_id)) {
      return false;
    }

    const petitionFields = await ctx.petitions.loadField(
      unique(relationships.flatMap((r) => [r.leftSidePetitionFieldId, r.rightSidePetitionFieldId])),
    );

    if (!petitionFields.every((f) => isNonNullish(f) && f.petition_id === petitionId)) {
      return false;
    }

    return true;
  };
}

export function userHasAccessToCreatePetitionFromProfilePrefillInput<
  TypeName extends string,
  FieldName extends string,
  TPetitionIdArg extends Arg<TypeName, FieldName, number>,
  TInputArg extends Arg<
    TypeName,
    FieldName,
    NexusGenInputs["CreatePetitionFromProfilePrefillInput"][]
  >,
  TProfileIdArg extends Arg<TypeName, FieldName, number>,
  TFieldIdArg extends Arg<TypeName, FieldName, number | null | undefined>,
>(
  petitionIdArg: TPetitionIdArg,
  inputArg: TInputArg,
  profileIdArg?: TProfileIdArg,
  fieldIdArg?: TFieldIdArg,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const mainProfileId = profileIdArg ? getArg(args, profileIdArg) : undefined;
    const mainFieldId = fieldIdArg ? getArg(args, fieldIdArg) : undefined;

    const petitionId = getArg(args, petitionIdArg);
    const input = unMaybeArray(getArg(args, inputArg));

    if (input.length === 0) {
      // nothing to verify
      return true;
    }

    if (isNonNullish(mainProfileId)) {
      if (!mainFieldId) {
        throw new ForbiddenError("templateFieldId arg is required when providing profileId");
      }

      const inputEntry = input.find((i) => i.petitionFieldId === mainFieldId);
      if (isNullish(inputEntry) || !inputEntry.profileIds.some((id) => id === mainProfileId)) {
        throw new ForbiddenError(
          "provided petitionFieldId must be in the prefill input and include the main profileId",
        );
      }
    }

    const inputFieldIds = input.map((i) => i.petitionFieldId);

    if (inputFieldIds.length !== unique(inputFieldIds).length) {
      throw new ForbiddenError("petitionFieldId should not repeat in prefill input");
    }

    const inputFields = await ctx.petitions.loadField(inputFieldIds);

    if (!inputFields.every(isNonNullish)) {
      throw new ForbiddenError("Invalid fields");
    }

    if (inputFields.some((f) => f.petition_id !== petitionId)) {
      throw new ForbiddenError("fields must belong to the petition");
    }

    if (inputFields.some((f) => f.type !== "FIELD_GROUP" || f.profile_type_id === null)) {
      throw new ForbiddenError("fields must have type FIELD_GROUP and have a linked profile type");
    }

    const inputProfileIds = input.flatMap((i) => i.profileIds);
    const inputProfiles =
      inputProfileIds.length > 0 ? await ctx.profiles.loadProfile(inputProfileIds) : [];

    if (!inputProfiles.every(isNonNullish)) {
      throw new ForbiddenError("Invalid profiles");
    }
    if (!inputProfiles.every((p) => ["OPEN", "CLOSED"].includes(p.status))) {
      throw new ForbiddenError("profiles must be OPEN or CLOSED");
    }

    let fieldsWithCompatibleProfiles: { fieldId: number; profileIds: number[] }[] | null = null;
    if (isNonNullish(mainProfileId) && isNonNullish(mainFieldId)) {
      const profileRelationships =
        await ctx.profiles.loadProfileRelationshipsByProfileId(mainProfileId);

      const templateRelationships = (
        await ctx.petitions.loadPetitionFieldGroupRelationshipsByPetitionId(petitionId)
      ).filter(
        (r) =>
          r.left_side_petition_field_id === mainFieldId ||
          r.right_side_petition_field_id === mainFieldId,
      );

      const relationshipTypes =
        templateRelationships.length > 0
          ? await ctx.profiles.loadProfileRelationshipType(
              unique(templateRelationships.map((r) => r.profile_relationship_type_id)),
            )
          : [];

      const petitionFieldGroups = (await ctx.petitions.loadFieldsForPetition(petitionId)).filter(
        (f) => isNonNullish(f) && f.type === "FIELD_GROUP" && isNonNullish(f.profile_type_id),
      );

      // iterate all FIELD_GROUPs of the template,
      //and for each get every possible valid profile given their relationships and profile types configuration
      fieldsWithCompatibleProfiles =
        profileRelationships.length === 0
          ? [{ fieldId: mainFieldId, profileIds: [mainProfileId] }]
          : petitionFieldGroups.map((f) => {
              const profileIds = unique([
                ...(mainFieldId === f.id ? [mainProfileId] : []),
                ...profileRelationships
                  .filter((pr) => {
                    return templateRelationships
                      .filter(
                        // relationships of the same type
                        (tr) => tr.profile_relationship_type_id === pr.profile_relationship_type_id,
                      )
                      .some((tr) => {
                        let [leftId, rightId] = [
                          tr.left_side_petition_field_id,
                          tr.right_side_petition_field_id,
                        ];

                        const relationshipType = relationshipTypes.find(
                          (rt) => rt?.id === tr.profile_relationship_type_id,
                        );

                        assert(
                          isNonNullish(relationshipType),
                          "relationshipType expected to be defined",
                        );
                        if (relationshipType.is_reciprocal) {
                          return (
                            (leftId === mainFieldId && rightId === f.id) ||
                            (leftId === f.id && rightId === mainFieldId)
                          );
                        }

                        if (pr.right_side_profile_id === mainProfileId) {
                          [leftId, rightId] = [rightId, leftId];
                        }
                        if (tr.direction === "RIGHT_LEFT") {
                          [leftId, rightId] = [rightId, leftId];
                        }

                        return leftId === mainFieldId && rightId === f.id;
                      });
                  })
                  .map((r) =>
                    r.left_side_profile_id === mainProfileId
                      ? r.right_side_profile_id
                      : r.left_side_profile_id,
                  ),
              ]);

              return { fieldId: f.id, profileIds };
            });
    }

    for (const entry of input) {
      if (entry.profileIds.length === 0) {
        // nothing to verify
        continue;
      }
      const field = inputFields.find((f) => f.id === entry.petitionFieldId)!;
      const profiles = entry.profileIds.map((id) => inputProfiles.find((p) => p.id === id)!);

      if (profiles.some((p) => p.profile_type_id !== field.profile_type_id)) {
        throw new ForbiddenError(
          "profiles must belong to the same profile type as the field in prefill group",
        );
      }

      if (!field.multiple && profiles.length > 1) {
        throw new ForbiddenError("field does not allow multiple profiles");
      }

      if (isNonNullish(fieldsWithCompatibleProfiles)) {
        const compatibleProfileIds = fieldsWithCompatibleProfiles.find(
          (f) => f.fieldId === field.id,
        )?.profileIds;
        assert(compatibleProfileIds, "compatibleProfileIds expected to be defined");

        if (!profiles.every((p) => compatibleProfileIds.includes(p.id))) {
          throw new ForbiddenError("profiles in prefill must be compatible with the field");
        }
      }
    }

    return true;
  };
}

export function usersCanBeMentionedInComment<
  TypeName extends string,
  FieldName extends string,
  TArgContent extends Arg<TypeName, FieldName, any>,
>(argContent: TArgContent): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const mentions = collectMentionsFromSlate(getArg(args, argContent));
    const [userMentions, userGroupMentions] = partition(mentions, (m) => m.type === "User");
    const passes = await ctx.petitions.canBeMentionedInPetitionFieldComment(
      ctx.user!.org_id,
      userMentions.map((m) => m.id),
      userGroupMentions.map((m) => m.id),
    );
    if (!passes) {
      throw new ForbiddenError("Mention not allowed");
    }

    return true;
  };
}

export function attachmentBelongsToPetitionComment<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
  TArg2 extends Arg<TypeName, FieldName, number>,
>(attachmentIdArg: TArg1, commentIdArg: TArg2): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const attachment = await ctx.petitionComments.loadPetitionCommentAttachment(
        getArg(args, attachmentIdArg),
      );

      return attachment?.petition_comment_id === getArg(args, commentIdArg);
    } catch {}
    return false;
  };
}

export function commentIsNotFromApprovalRequest<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(commentIdArg: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const commentId = getArg(args, commentIdArg);
    const comment = await ctx.petitions.loadPetitionFieldComment(commentId);

    return isNonNullish(comment) && comment.approval_metadata === null;
  };
}

export function petitionDoesNotHaveStartedProcess<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const [processType] = await ctx.petitions.getPetitionStartedProcesses(
      unMaybeArray(getArg(args, argName)),
    );
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

function fieldIsNotReferencedInApprovalFlowConfig<
  TypeName extends string,
  FieldName extends string,
>(
  petitionIdArg: Arg<TypeName, FieldName, number>,
  fieldIdArg: Arg<TypeName, FieldName, MaybeArray<number>>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const fieldIds = unMaybeArray(getArg(args, fieldIdArg));

    const petition = await ctx.petitions.loadPetition(petitionId);
    assert(petition, "petition expected to be defined");

    if (!petition.approval_flow_config) {
      return true;
    }

    const referencedFieldId = fieldIds.find((id) =>
      petition.approval_flow_config?.some((config) =>
        config.visibility?.conditions.some(
          (condition) => "fieldId" in condition && condition.fieldId === id,
        ),
      ),
    );

    if (isNonNullish(referencedFieldId)) {
      throw new ApolloError(
        `The petition has an approval flow step that references this field`,
        "FIELD_IS_REFERENCED_IN_APPROVAL_FLOW_CONFIG",
        { fieldId: toGlobalId("PetitionField", referencedFieldId) },
      );
    }

    return true;
  };
}

function fieldIsNotReferencedInPetitionAttachmentsVisibility<
  TypeName extends string,
  FieldName extends string,
>(
  petitionIdArg: Arg<TypeName, FieldName, number>,
  fieldIdArg: Arg<TypeName, FieldName, MaybeArray<number>>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const fieldIds = unMaybeArray(getArg(args, fieldIdArg));

    const petitionAttachments = await ctx.petitions.loadPetitionAttachmentsByPetitionId(petitionId);

    const referencedFieldId = fieldIds.find((id) =>
      petitionAttachments.find((a) =>
        a.visibility?.conditions.some(
          (c: PetitionFieldLogicCondition) => "fieldId" in c && c.fieldId === id,
        ),
      ),
    );

    if (isNonNullish(referencedFieldId)) {
      throw new ApolloError(
        `The petition has an attachment that references this field`,
        "FIELD_IS_REFERENCED_IN_PETITION_ATTACHMENTS_VISIBILITY",
        { fieldId: toGlobalId("PetitionField", referencedFieldId) },
      );
    }
    return true;
  };
}

export function fieldIsNotReferencedInLogicConditions<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  petitionIdArg: TArgPetitionId,
  fieldIdArg: TArgFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return and(
    fieldIsNotReferencedInFieldLogic(petitionIdArg, fieldIdArg),
    fieldIsNotReferencedInApprovalFlowConfig(petitionIdArg, fieldIdArg),
    fieldIsNotReferencedInPetitionAttachmentsVisibility(petitionIdArg, fieldIdArg),
  );
}
