import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { countBy, isDefined, uniq } from "remeda";
import { FeatureFlagName, IntegrationType, PetitionPermissionType } from "../../db/__types";
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
      const petitionIds = unMaybeArray(args[argName] as MaybeArray<number>);
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
      const signatureRequestIds = unMaybeArray(args[argName] as MaybeArray<number>);
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
      const commentIds = unMaybeArray(args[argName] as MaybeArray<number>);
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
      const templateIds = args[argName];
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
      const petitionIds = unMaybeArray(args[argName] as MaybeArray<number>);
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
      const petitionIds = unMaybeArray(args[argName] as MaybeArray<number>);
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
        unMaybeArray(args[argNameFieldIds] as MaybeArray<number>)
      );
    } catch {}
    return false;
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
        unMaybeArray(args[argNameAttachmentId] as MaybeArray<number>)
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
        unMaybeArray(args[argNameReplyIds] as MaybeArray<number>)
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
        unMaybeArray(args[argNameReplyIds] as MaybeArray<number>)
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
        unMaybeArray(args[argNameAccessIds] as MaybeArray<number>)
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
        unMaybeArray(args[argNameCommentIds] as MaybeArray<number>)
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
        unMaybeArray(args[argNameAccessIds] as MaybeArray<number>)
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
        unMaybeArray(args[argNamePetitionIds] as MaybeArray<number>)
      );
      return petitions.every((p) => isDefined(p) && !p.is_readonly);
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
        unMaybeArray(args[argNamePetitionIds] as MaybeArray<number>)
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
      const publicLinks = await ctx.petitions.loadPublicPetitionLinksByTemplateId(args[argName]);
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
