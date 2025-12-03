import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish, isNullish, partition } from "remeda";
import { ApiContext } from "../../../context";
import { PetitionPermissionType, UserStatus } from "../../../db/__types";
import { PetitionFieldLogicCondition, PetitionFieldVisibility } from "../../../util/fieldLogic";
import { toGlobalId } from "../../../util/globalId";
import { Maybe, MaybeArray, unMaybeArray } from "../../../util/types";
import { NexusGenInputs } from "../../__types";
import { and, Arg, getArg } from "../../helpers/authorize";
import { ApolloError } from "../../helpers/errors";
import { contextUserHasAccessToUserGroups } from "../../user-group/authorizers";

async function contextUserHasAccessToUsers(userIds: number[], ctx: ApiContext) {
  try {
    if (userIds.length === 0) {
      return true;
    }
    // ids of users in my same organization
    return (await ctx.users.loadUser(userIds)).every(
      (u) => isNonNullish(u) && u.org_id === ctx.user!.org_id,
    );
  } catch {}
  return false;
}

export function userHasAccessToUsers<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number> | null | undefined>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = getArg(args, argName);
    if (isNullish(userIds)) {
      return true;
    }
    return contextUserHasAccessToUsers(unMaybeArray(userIds), ctx);
  };
}

interface UserOrUserGroup {
  userId?: number | null;
  userGroupId?: number | null;
}

export function userHasAccessToUserAndUserGroups<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, UserOrUserGroup[] | null | undefined>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const permissions = getArg(args, argName);
      if (isNullish(permissions)) {
        return true;
      }
      for (const p of permissions) {
        if (Number(isNonNullish(p.userId)) + Number(isNonNullish(p.userGroupId)) !== 1) {
          return false;
        }
      }
      const [uPermissions, ugPermissions] = partition(permissions, (p) => isNonNullish(p.userId));

      const [hasAccessToUsers, hasAccessToUserGroups] = await Promise.all([
        contextUserHasAccessToUsers(
          uPermissions.map((p) => p.userId!),
          ctx,
        ),
        contextUserHasAccessToUserGroups(
          ugPermissions.map((p) => p.userGroupId!),
          ctx,
        ),
      ]);
      return hasAccessToUsers && hasAccessToUserGroups;
    } catch {}
    return false;
  };
}

export function argUserHasStatus<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argNameUserId: TArg, status: UserStatus): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const userIds = unMaybeArray(getArg(args, argNameUserId));
      if (userIds.length === 0) {
        return true;
      }

      return (await ctx.users.loadUser(userIds)).every(
        (u) => isNonNullish(u) && u.status === status,
      );
    } catch {}
    return false;
  };
}

export function userHasAccessToPublicPetitionLink<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(
  argName: TArg,
  permissionType?: PetitionPermissionType,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const publicPetitionLinkIds = unMaybeArray(getArg(args, argName));
      const publicPetitionLinks = (
        await ctx.petitions.loadPublicPetitionLink(publicPetitionLinkIds)
      ).filter(isNonNullish);

      return await ctx.petitions.userHasAccessToPetitions(
        ctx.user!.id,
        publicPetitionLinks.map((ppl) => ppl.template_id),
        permissionType,
      );
    } catch {}
    return false;
  };
}

export function publicPetitionLinkIsNotScheduledForDeletion<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, number>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const publicPetitionLinkId = getArg(args, argName);
    const link = await ctx.petitions.loadPublicPetitionLink(publicPetitionLinkId);
    if (!link) {
      return false;
    }
    const template = await ctx.petitions.loadPetition(link.template_id);
    return template?.deletion_scheduled_at === null;
  };
}

export function userCanSendAs<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, Maybe<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const senderId = getArg(args, argName);
    if (isNullish(senderId) || senderId === ctx.user!.id) {
      return true;
    }
    try {
      const [hasFeatureFlag, permissions] = await Promise.all([
        ctx.featureFlags.orgHasFeatureFlag(ctx.user!.org_id, "ON_BEHALF_OF"),
        ctx.users.loadUserPermissions(ctx.user!.id),
      ]);
      if (!hasFeatureFlag) {
        return false;
      }

      if (permissions.includes("PETITIONS:SEND_ON_BEHALF")) {
        return true;
      }
      const delegates = await ctx.users.loadReverseUserDelegatesByUserId(ctx.user!.id);
      if (delegates.some((d) => d.id === senderId)) {
        return true;
      }
    } catch {}
    throw new ApolloError("You are not allowed to send as this user", "SEND_AS_ERROR");
  };
}

export function petitionCanUploadAttachments<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgFileUploadInput extends Arg<TypeName, FieldName, any[]>,
>(
  petitionIdArg: TArgPetitionId,
  dataArrArg: TArgFileUploadInput,
  maxAllowed: number,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const newUploadsCount = getArg(args, dataArrArg).length;
    const allAttachments = await ctx.petitions.loadPetitionAttachmentsByPetitionId(petitionId);
    return allAttachments.length + newUploadsCount <= maxAllowed;
  };
}

export function petitionVariableCanBeCreated<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgData extends Arg<TypeName, FieldName, NexusGenInputs["CreatePetitionVariableInput"]>,
>(petitionIdArg: TArgPetitionId, dataArg: TArgData): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const data = getArg(args, dataArg);
    const [petition, fields] = await Promise.all([
      ctx.petitions.loadPetition.raw(petitionId),
      ctx.petitions.loadAllFieldsByPetitionId(petitionId),
    ]);

    if (petition?.variables?.some((v) => v.name === data.name)) {
      throw new ApolloError(
        "Variable with this name already exists",
        "PETITION_VARIABLE_ALREADY_EXISTS_ERROR",
      );
    }

    if (fields.some((f) => f.alias === data.name)) {
      throw new ApolloError("Field with this alias already exists", "ALIAS_ALREADY_EXISTS");
    }

    return true;
  };
}

function variableIsNotReferencedInFieldLogic<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgVariableName extends Arg<TypeName, FieldName, string>,
>(
  petitionIdArg: TArgPetitionId,
  variableNameArg: TArgVariableName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const variableName = getArg(args, variableNameArg);

    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);

    const referencingFieldInMath = petitionFields.filter((f) => {
      return f.math?.some(
        (m) =>
          m.conditions.some((c) => "variableName" in c && c.variableName === variableName) ||
          m.operations.some(
            (op) =>
              op.variable === variableName ||
              (op.operand.type === "VARIABLE" && op.operand.name === variableName),
          ),
      );
    });

    const referencingFieldInVisibility = petitionFields.filter((f) => {
      return (f.visibility as PetitionFieldVisibility | null)?.conditions.some(
        (c) => "variableName" in c && c.variableName === variableName,
      );
    });

    if (referencingFieldInMath.length > 0 || referencingFieldInVisibility.length > 0) {
      throw new ApolloError(
        "The variable is being referenced in another field.",
        "VARIABLE_IS_REFERENCED_ERROR",
        {
          referencingFieldInMathIds: referencingFieldInMath.map((f) =>
            toGlobalId("PetitionField", f.id),
          ),
          referencingFieldInVisibilityIds: referencingFieldInVisibility.map((f) =>
            toGlobalId("PetitionField", f.id),
          ),
        },
      );
    }

    return true;
  };
}

function variableIsNotReferencedInApprovalFlowConfig<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgVariableName extends Arg<TypeName, FieldName, string>,
>(
  petitionIdArg: TArgPetitionId,
  variableNameArg: TArgVariableName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const variableName = getArg(args, variableNameArg);

    const petition = await ctx.petitions.loadPetition(petitionId);

    const referencingApprovalFlowConfigs = petition?.approval_flow_config?.filter((config) => {
      return config.visibility?.conditions.some(
        (c) => "variableName" in c && c.variableName === variableName,
      );
    });

    if (referencingApprovalFlowConfigs?.length) {
      throw new ApolloError(
        "The variable is being referenced in an approval flow configuration.",
        "VARIABLE_IS_REFERENCED_IN_APPROVAL_FLOW_CONFIG",
      );
    }

    return true;
  };
}

function variableIsNotReferencedInPetitionAttachmentsVisibility<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgVariableName extends Arg<TypeName, FieldName, string>,
>(
  petitionIdArg: TArgPetitionId,
  variableNameArg: TArgVariableName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const variableName = getArg(args, variableNameArg);

    const petitionAttachments = await ctx.petitions.loadPetitionAttachmentsByPetitionId(petitionId);

    if (
      petitionAttachments.some((a) =>
        a.visibility?.conditions.some(
          (c: PetitionFieldLogicCondition) =>
            "variableName" in c && c.variableName === variableName,
        ),
      )
    ) {
      throw new ApolloError(
        "The variable is being referenced in a petition attachment visibility condition.",
        "VARIABLE_IS_REFERENCED_IN_PETITION_ATTACHMENTS_VISIBILITY",
      );
    }
    return true;
  };
}

export function variableIsNotReferencedInLogicConditions<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgVariableName extends Arg<TypeName, FieldName, string>,
>(
  petitionIdArg: TArgPetitionId,
  variableNameArg: TArgVariableName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return and(
    variableIsNotReferencedInFieldLogic(petitionIdArg, variableNameArg),
    variableIsNotReferencedInApprovalFlowConfig(petitionIdArg, variableNameArg),
    variableIsNotReferencedInPetitionAttachmentsVisibility(petitionIdArg, variableNameArg),
  );
}

function variableIsNotReferencedInUpdateProfileOnClose<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgVariableName extends Arg<TypeName, FieldName, string>,
>(
  petitionIdArg: TArgPetitionId,
  variableNameArg: TArgVariableName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = getArg(args, petitionIdArg);
    const variableName = getArg(args, variableNameArg);

    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);
    const referencingFieldGroups = petitionFields.filter(
      (f) =>
        f.type === "FIELD_GROUP" &&
        isNonNullish(f.options.updateProfileOnClose) &&
        Array.isArray(f.options.updateProfileOnClose) &&
        f.options.updateProfileOnClose.length > 0 &&
        f.options.updateProfileOnClose.some(
          (o: any) => o.source.type === "VARIABLE" && o.source.name === variableName,
        ),
    );

    if (referencingFieldGroups.length > 0) {
      throw new ApolloError(
        `Variable is being referenced on an updateProfileOnClose`,
        "VARIABLE_IS_REFERENCED_IN_UPDATE_PROFILE_ON_CLOSE_CONFIG",
        {
          fieldGroupsIds: referencingFieldGroups.map((f) => toGlobalId("PetitionField", f.id)),
        },
      );
    }

    return true;
  };
}

export function variableIsNotReferencedInFieldOptions<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgVariableName extends Arg<TypeName, FieldName, string>,
>(
  petitionIdArg: TArgPetitionId,
  variableNameArg: TArgVariableName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return and(variableIsNotReferencedInUpdateProfileOnClose(petitionIdArg, variableNameArg));
}
