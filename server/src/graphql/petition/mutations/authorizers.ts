import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish, isNullish, partition } from "remeda";
import { ApiContext } from "../../../context";
import { PetitionPermissionType, UserStatus } from "../../../db/__types";
import { PetitionFieldOptions } from "../../../services/PetitionFieldService";
import { PetitionFieldVisibility } from "../../../util/fieldLogic";
import { toGlobalId } from "../../../util/globalId";
import { never } from "../../../util/never";
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
  permissionTypes?: PetitionPermissionType[],
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
        permissionTypes,
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

export function variableIsNotBeingReferencedByFieldLogic<
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

export function variableIsNotBeingReferencedByApprovalFlowConfig<
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

export function variableIsNotBeingReferencedOnLogicConditions<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgVariableName extends Arg<TypeName, FieldName, string>,
>(
  petitionIdArg: TArgPetitionId,
  variableNameArg: TArgVariableName,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return and(
    variableIsNotBeingReferencedByFieldLogic(petitionIdArg, variableNameArg),
    variableIsNotBeingReferencedByApprovalFlowConfig(petitionIdArg, variableNameArg),
  );
}

export function fieldIsNotBeingUsedInAutoSearchConfig<
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
    const fieldIds = unMaybeArray(getArg(args, fieldIdArg));

    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);
    const fieldsWithAutoSearchConfig = petitionFields.filter(
      (f) =>
        isNonNullish(f.options.autoSearchConfig) &&
        (f.type === "BACKGROUND_CHECK" || f.type === "ADVERSE_MEDIA_SEARCH"),
    );

    for (const fieldId of fieldIds) {
      const field = petitionFields.find((f) => f.id === fieldId);
      if (!field) {
        continue;
      }

      // these types can be referenced in autoSearchConfig
      if (["SHORT_TEXT", "DATE", "SELECT", "BACKGROUND_CHECK"].includes(field.type)) {
        for (const f of fieldsWithAutoSearchConfig) {
          if (f.type === "BACKGROUND_CHECK") {
            const config = f.options.autoSearchConfig as NonNullable<
              PetitionFieldOptions["BACKGROUND_CHECK"]["autoSearchConfig"]
            >;

            if (
              config.name.includes(field.id) ||
              config.date === field.id ||
              config.country === field.id ||
              config.birthCountry === field.id
            ) {
              throw new ApolloError(
                `PetitionField ${toGlobalId("PetitionField", fieldId)} is being referenced on an autoSearchConfig`,
                "FIELD_IS_REFERENCED_IN_AUTO_SEARCH_CONFIG",
                { fieldId: toGlobalId("PetitionField", fieldId) },
              );
            }
          } else if (f.type === "ADVERSE_MEDIA_SEARCH") {
            const config = f.options.autoSearchConfig as NonNullable<
              PetitionFieldOptions["ADVERSE_MEDIA_SEARCH"]["autoSearchConfig"]
            >;

            if ((config.name ?? []).includes(field.id) || config.backgroundCheck === field.id) {
              throw new ApolloError(
                `PetitionField ${toGlobalId("PetitionField", fieldId)} is being referenced on an autoSearchConfig`,
                "FIELD_IS_REFERENCED_IN_AUTO_SEARCH_CONFIG",
                { fieldId: toGlobalId("PetitionField", fieldId) },
              );
            }
          } else {
            never(`${field.type} cannot have autoSearchConfig`);
          }
        }
      }
    }
    return true;
  };
}
