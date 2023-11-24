import { core } from "nexus";
import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isDefined, partition, uniq, zip } from "remeda";
import {
  FeatureFlagName,
  IntegrationType,
  Petition,
  PetitionAccess,
  PetitionAccessStatus,
  PetitionAttachmentType,
  PetitionFieldType,
  PetitionPermissionType,
  PetitionStatus,
} from "../../db/__types";
import { unMaybeArray } from "../../util/arrays";
import { PetitionFieldMath, PetitionFieldVisibility } from "../../util/fieldLogic";
import { fromGlobalIds, toGlobalId } from "../../util/globalId";
import { MaybeArray } from "../../util/types";
import { NexusGenInputs } from "../__types";
import { Arg, ArgAuthorizer } from "../helpers/authorize";
import { ApolloError } from "../helpers/errors";

function createPetitionAuthorizer<TRest extends any[] = []>(
  predicate: (petition: Petition, ...rest: TRest) => boolean,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      const petitionIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
      if (petitionIds.length === 0) {
        return true;
      }
      const petitions = await ctx.petitions.loadPetition(petitionIds);
      return petitions.every((petition) => isDefined(petition) && predicate(petition, ...rest));
    };
  }) as ArgAuthorizer<MaybeArray<number>, TRest>;
}

function createPetitionAccessAuthorizer<TRest extends any[] = []>(
  predicate: (access: PetitionAccess, ...rest: TRest) => boolean,
) {
  return ((argName, ...rest: TRest) => {
    return async (_, args, ctx) => {
      try {
        const accessIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
        if (accessIds.length === 0) {
          return true;
        }
        const accesses = await ctx.petitions.loadAccess(accessIds);
        return accesses.every((access) => isDefined(access) && predicate(access, ...rest));
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
  permissionTypes?: PetitionPermissionType[],
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
        permissionTypes,
      );
    } catch {}
    return false;
  };
}

export function userHasAccessToSignatureRequest<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argName: TArg,
  permissionTypes?: PetitionPermissionType[],
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
        permissionTypes,
      );
    } catch {}
    return false;
  };
}

export const petitionsArePublicTemplates = createPetitionAuthorizer(
  (p) => p.is_template && p.template_public,
);

export const petitionsAreNotPublicTemplates = createPetitionAuthorizer((p) => !p.template_public);

export const petitionsAreOfTypePetition = createPetitionAuthorizer((p) => !p.is_template);
export const petitionsAreOfTypeTemplate = createPetitionAuthorizer((p) => p.is_template);

export function fieldIsNotFixed<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
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
  TArg2 extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argNamePetitionId: TArg1,
  argNameFieldIds: TArg2 | ((args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<number>),
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const fieldIds = uniq(
        unMaybeArray(
          (typeof argNameFieldIds === "function"
            ? (argNameFieldIds as any)(args)
            : (args as any)[argNameFieldIds]) as MaybeArray<number>,
        ),
      );

      return await ctx.petitions.fieldsBelongToPetition(
        args[argNamePetitionId] as unknown as number,
        fieldIds,
      );
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
      const ids = unMaybeArray(args[argNameFieldIds] as unknown as MaybeArray<number>);
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
      const ids = unMaybeArray(args[argNameFieldIds] as unknown as MaybeArray<number>);
      return await ctx.petitions.fieldsAreNotInternal(ids);
    } catch {}
    return false;
  };
}

export function fieldCanBeReplied<
  TypeName extends string,
  FieldName extends string,
  TOverwrite extends Arg<TypeName, FieldName, boolean | null | undefined>,
>(
  fieldsArg: (
    args: core.ArgsValue<TypeName, FieldName>,
  ) => MaybeArray<{ id: number; parentReplyId?: number | null }>,
  overWriteArg?: TOverwrite,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const _fields = unMaybeArray(fieldsArg(args));

    const [_fieldsNoParent, _fieldsWithParent] = partition(
      _fields,
      (f) => !isDefined(f.parentReplyId),
    );

    const overwriteExisting = isDefined(overWriteArg)
      ? (args[overWriteArg] as boolean | null | undefined) ?? false
      : false;

    const [fieldsNoParent, fieldsNoParentReplies, fieldsWithParent, fieldsChildReplies] =
      await Promise.all([
        ctx.petitions.loadField(_fieldsNoParent.map((f) => f.id)),
        ctx.petitions.loadRepliesForField(_fieldsNoParent.map((f) => f.id)),
        ctx.petitions.loadField(_fieldsWithParent.map((f) => f.id)),
        ctx.petitions.loadPetitionFieldGroupChildReplies.raw(
          _fieldsWithParent.map((f) => ({
            petitionFieldId: f.id,
            parentPetitionFieldReplyId: f.parentReplyId!,
          })),
        ),
      ]);

    for (const [field, replies] of [
      ...zip(fieldsNoParent, fieldsNoParentReplies),
      ...zip(fieldsWithParent, fieldsChildReplies),
    ]) {
      if (!field || (!field.multiple && replies.length > 0 && !overwriteExisting)) {
        throw new ApolloError(
          "The field is already replied and does not accept multiple replies",
          "FIELD_ALREADY_REPLIED_ERROR",
        );
      }
    }

    return true;
  };
}

export function fieldHasType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argFieldId: TArg | ((args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<number>),
  fieldType: MaybeArray<PetitionFieldType>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldIds = uniq(
      unMaybeArray(
        (typeof argFieldId === "function"
          ? (argFieldId as any)(args)
          : (args as any)[argFieldId]) as MaybeArray<number>,
      ),
    );
    const fields = await ctx.petitions.loadField(fieldIds);
    const validFieldTypes = unMaybeArray(fieldType);

    const invalidField = fields.find((field) => !validFieldTypes.includes(field!.type));

    if (isDefined(invalidField)) {
      throw new ApolloError(
        `Expected ${validFieldTypes.join(" or ")}, got ${invalidField.type}`,
        "INVALID_FIELD_TYPE_ERROR",
      );
    }

    return true;
  };
}

export function replyIsForFieldOfType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argReplyId: TArg | ((args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<number>),
  fieldType: MaybeArray<PetitionFieldType>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyIds = uniq(
      unMaybeArray(
        (typeof argReplyId === "function"
          ? (argReplyId as any)(args)
          : (args as any)[argReplyId]) as MaybeArray<number>,
      ),
    );

    const [fields, replies] = await Promise.all([
      ctx.petitions.loadFieldForReply(replyIds),
      ctx.petitions.loadFieldReply(replyIds),
    ]);

    const validFieldTypes = unMaybeArray(fieldType);

    const invalidField = fields.find((field) => !validFieldTypes.includes(field!.type));
    const invalidReply = replies.find((reply) => !validFieldTypes.includes(reply!.type));

    if (invalidField || invalidReply) {
      throw new ApolloError(
        `Expected ${validFieldTypes.join(" or ")}, got ${(invalidField || invalidReply)!.type}`,
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
      const petitionId = args[petitionIdArg] as unknown as number;
      const type = args[attachmentTypeArg] as unknown as PetitionAttachmentType;
      const attachmentIds = args[attachmentIdsArg] as unknown as number[];

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
        args[argNameFieldId] as unknown as number,
        unMaybeArray(args[argNameAttachmentId] as unknown as MaybeArray<number>),
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
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameAttachmentId] as unknown as MaybeArray<number>),
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
>(
  argNamePetitionId: TArg1,
  argNameReplyIds: TArg2 | ((args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<number>),
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionId = args[argNamePetitionId] as unknown as number;
      const replyIds = uniq(
        unMaybeArray(
          (typeof argNameReplyIds === "function"
            ? (argNameReplyIds as any)(args)
            : (args as any)[argNameReplyIds]) as MaybeArray<number>,
        ),
      );

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
        args[argNameFieldId] as unknown as number,
        unMaybeArray(args[argNameReplyIds] as unknown as MaybeArray<number>),
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
      const field = (await ctx.petitions.loadField(args[argNameFieldId] as unknown as number))!;
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
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameAccessIds] as unknown as MaybeArray<number>),
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
    const ids = unMaybeArray(args[argNameAccessIds] as unknown as MaybeArray<number>);
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
      return await ctx.petitions.messagesBelongToPetition(
        args[argNamePetitionId] as unknown as number,
        [args[argNameMessageId] as unknown as number],
      );
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
        args[argNamePetitionId] as unknown as number,
        unMaybeArray(args[argNameCommentIds] as unknown as MaybeArray<number>),
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
        unMaybeArray(args[argNameAccessIds] as unknown as MaybeArray<number>),
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
      return await ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, feature);
    } catch {}
    return false;
  };
}

export function petitionHasRepliableFields<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argNamePetitionId: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const petitionId = args[argNamePetitionId] as unknown as number;
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
      const parentFieldIds = uniq(childrenFields.map((f) => f.parent_petition_field_id!));
      if (fieldGroups.some((f) => !parentFieldIds.includes(f.id))) {
        return false;
      }

      return true;
    } catch {}
    return false;
  };
}

export const petitionsAreEditable = createPetitionAuthorizer(
  (petition) => !isDefined(petition.restricted_at),
);

export function templateDoesNotHavePublicPetitionLink<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const publicLinks = await ctx.petitions.loadPublicPetitionLinksByTemplateId(
        args[argName] as unknown as number,
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
  TArg1 extends Arg<TypeName, FieldName, number>,
>(
  argReplyId: TArg1 | ((args: core.ArgsValue<TypeName, FieldName>) => MaybeArray<number>),
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const replyIds = uniq(
      unMaybeArray(
        (typeof argReplyId === "function"
          ? (argReplyId as any)(args)
          : (args as any)[argReplyId]) as MaybeArray<number>,
      ),
    );

    const replies = await ctx.petitions.loadFieldReply(replyIds);
    if (replies.some((r) => !isDefined(r))) {
      // field or reply could be already deleted, throw FORBIDDEN error
      return false;
    }

    const fieldGroupReplies = replies.filter(isDefined).filter((r) => r.type === "FIELD_GROUP");

    const allReplies = replies;

    if (fieldGroupReplies.length > 0) {
      const childFields = await ctx.petitions.loadPetitionFieldChildren(
        fieldGroupReplies.map((r) => r.petition_field_id),
      );
      if (childFields.length > 0) {
        const fieldGroupChildReplies = (
          await ctx.petitions.loadPetitionFieldGroupChildReplies.raw(
            zip(fieldGroupReplies, childFields).flatMap(([reply, fields]) =>
              fields.map((field) => ({
                petitionFieldId: field.id,
                parentPetitionFieldReplyId: reply.id,
              })),
            ),
          )
        ).flat();

        allReplies.push(...fieldGroupChildReplies);
      }
    }

    if (allReplies.some((r) => r!.status === "APPROVED" || r!.anonymized_at !== null)) {
      throw new ApolloError(
        `The reply has been approved and cannot be updated.`,
        "REPLY_ALREADY_APPROVED_ERROR",
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
    const replyId = args[argReplyId] as unknown as number;

    const field = await ctx.petitions.loadFieldForReply(replyId);
    if (!isDefined(field)) {
      return false;
    }

    if (field.type === "FIELD_GROUP" && !field.optional) {
      const replies = await ctx.petitions.loadRepliesForField(field.id);
      if (replies.length === 1 && replies[0].id === replyId) {
        throw new ApolloError(
          `You can't delete the last reply of a required FIELD_GROUP field`,
          "DELETE_FIELD_GROUP_REPLY_ERROR",
        );
      }
      ctx.petitions.loadRepliesForField.dataloader.clear(field.id);
    }
    return true;
  };
}

export const petitionIsNotAnonymized = createPetitionAuthorizer(
  (petition) => petition.anonymized_at === null,
);

export function signatureRequestIsNotAnonymized<
  TypeName extends string,
  FieldName extends string,
  TArg1 extends Arg<TypeName, FieldName, number>,
>(argSignatureRequestId: TArg1): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const signature = await ctx.petitions.loadPetitionSignatureById(
      args[argSignatureRequestId] as unknown as number,
    );
    return signature?.anonymized_at === null;
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
  permissionTypes: PetitionPermissionType,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const paths = fromGlobalIds(
        unMaybeArray(args[folderIdsArg] as unknown as MaybeArray<string>),
        "PetitionFolder",
        true,
      ).ids;
      if (paths.length === 0) {
        return true;
      }

      return await ctx.petitions.userHasPermissionInFolders(
        ctx.user!.id,
        ctx.user!.org_id,
        (args[typeArg] as unknown) === "TEMPLATE",
        paths,
        permissionTypes,
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
      const petitionIds = unMaybeArray(args[argIds] as unknown as number | number[]);
      if (petitionIds.length === 0) {
        return true;
      }
      const path = args[argPath] as unknown as string;
      const petitions = await ctx.petitions.loadPetition(petitionIds);
      return petitions.every((p) => isDefined(p) && p.path === path);
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
      const folderIds = unMaybeArray(args[argFolderIds] as unknown as string | string[]);
      if (folderIds.length === 0) {
        return true;
      }
      const paths = fromGlobalIds(folderIds, "PetitionFolder", true).ids;
      const path = args[argPath] as unknown as string;
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
      const commentIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
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
    const commentIds = unMaybeArray(args[commentIdArg] as unknown as MaybeArray<number>);
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
    const data = args[dataArg] as unknown as NexusGenInputs["UpdatePetitionInput"];
    const defaultOnBehalfUserId = data.defaultOnBehalfId;
    if (!isDefined(defaultOnBehalfUserId)) {
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
    const petitionIds = args[petitionIdsArg] as unknown as number[];

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
    const parentFieldId = parentFieldIdArg ? (args[parentFieldIdArg] as unknown as number) : null;
    const childrenFieldIds = unMaybeArray(
      args[childrenFieldIdsArg] as unknown as MaybeArray<number>,
    );

    const fields = await ctx.petitions.loadField(childrenFieldIds);

    return fields.every(
      (f) =>
        isDefined(f?.parent_petition_field_id) &&
        (!isDefined(parentFieldId) || f!.parent_petition_field_id === parentFieldId),
    );
  };
}

export function parentFieldIsInternal<
  TypeName extends string,
  FieldName extends string,
  TArgChildFieldId extends Arg<TypeName, FieldName, number>,
>(childFieldIdArg: TArgChildFieldId): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const childId = args[childFieldIdArg] as unknown as number;
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
    const childFieldId = args[childFieldIdArg] as unknown as number;

    const field = (await ctx.petitions.loadField(childFieldId))!;

    return field.parent_petition_field_id === null || field.position !== 0;
  };
}

export function firstChildHasType<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(
  argFieldId: TArg,
  fieldType: MaybeArray<PetitionFieldType>,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const fieldId = args[argFieldId] as unknown as number;
    const [firstChild] = await ctx.petitions.loadPetitionFieldChildren(fieldId);
    const validFieldTypes = unMaybeArray(fieldType);

    return isDefined(firstChild) && validFieldTypes.includes(firstChild.type);
  };
}

export function fieldIsNotBeingReferencedByAnotherFieldLogic<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgFieldId extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  petitionIdArg: TArgPetitionId,
  fieldIdArg: TArgFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = args[petitionIdArg] as unknown as number;
    const ids = unMaybeArray(args[fieldIdArg] as unknown as MaybeArray<number>);

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
        (!isDefined(f.parent_petition_field_id) ||
          !targetFields.map((f) => f.id).includes(f.parent_petition_field_id)) && // filter children of target fields
        ((isDefined(f.visibility) &&
          (f.visibility as PetitionFieldVisibility).conditions.some(
            (c) => "fieldId" in c && fieldIds.includes(c.fieldId),
          )) ||
          (isDefined(f.math) &&
            (f.math as PetitionFieldMath[]).some(
              (math) =>
                math.conditions.some(
                  (c) => "fieldId" in c && fieldIds.includes(c.fieldId) && c.fieldId !== f.id,
                ) ||
                math.operations.some(
                  (op) =>
                    op.operand.type === "FIELD" &&
                    fieldIds.includes(op.operand.fieldId) &&
                    op.operand.fieldId !== f.id,
                ),
            ))),
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
>(
  petitionIdArg: TPetitionIdArg,
  aliasProp: (args: core.ArgsValue<TypeName, FieldName>) => string,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = args[petitionIdArg] as unknown as number;
    const alias = aliasProp(args);
    const [petitionVariables] = await ctx.petitions.getPetitionVariables([petitionId]);

    if (petitionVariables.some((v) => v.name === alias)) {
      throw new ApolloError(`Alias is being used as petition variable`, "ALIAS_ALREADY_EXISTS");
    }

    return true;
  };
}
