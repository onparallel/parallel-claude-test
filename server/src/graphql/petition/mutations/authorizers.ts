import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isNonNullish, isNullish, partition } from "remeda";
import { ApiContext } from "../../../context";
import { PetitionPermissionType, UserStatus } from "../../../db/__types";
import { PetitionFieldVisibility } from "../../../util/fieldLogic";
import { toGlobalId } from "../../../util/globalId";
import { Maybe, MaybeArray, unMaybeArray } from "../../../util/types";
import { NexusGenInputs } from "../../__types";
import { Arg } from "../../helpers/authorize";
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
    if (isNullish(args[argName])) {
      return true;
    }
    const userIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    return contextUserHasAccessToUsers(userIds, ctx);
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
      const permissions = args[argName] as unknown as UserOrUserGroup[] | null | undefined;
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
      const userIds = unMaybeArray(args[argNameUserId] as unknown as MaybeArray<number>);
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
      const publicPetitionLinkIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
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

export function userCanSendAs<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, Maybe<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const senderId = args[argName] as unknown as Maybe<number>;
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
    const petitionId = args[petitionIdArg] as unknown as number;
    const newUploadsCount = (args[dataArrArg] as unknown as any[]).length;
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
    const petitionId = args[petitionIdArg] as unknown as number;
    const data = args[dataArg] as unknown as NexusGenInputs["CreatePetitionVariableInput"];
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
    const petitionId = args[petitionIdArg] as unknown as number;
    const variableName = args[variableNameArg] as unknown as string;

    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);

    const referencingFields = petitionFields.filter((f) => {
      if (
        (f.visibility as PetitionFieldVisibility | null)?.conditions.some(
          (c) => "variableName" in c && c.variableName === variableName,
        )
      ) {
        return true;
      }

      if (
        f.math?.some(
          (m) =>
            m.conditions.some((c) => "variableName" in c && c.variableName === variableName) ||
            m.operations.some(
              (op) =>
                op.variable === variableName ||
                (op.operand.type === "VARIABLE" && op.operand.name === variableName),
            ),
        )
      ) {
        return true;
      }

      return false;
    });

    if (referencingFields.length > 0) {
      throw new ApolloError(
        "The variable is being referenced in another field.",
        "VARIABLE_IS_REFERENCED_ERROR",
      );
    }

    return true;
  };
}

export function fieldIsNotBeingUsedInMathOperation<
  TypeName extends string,
  FieldName extends string,
  TArgPetitionId extends Arg<TypeName, FieldName, number>,
  TArgFieldId extends Arg<TypeName, FieldName, number>,
>(
  petitionIdArg: TArgPetitionId,
  fieldIdArg: TArgFieldId,
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const petitionId = args[petitionIdArg] as unknown as number;
    const fieldId = args[fieldIdArg] as unknown as number;

    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);

    const field = petitionFields.find((f) => f.id === fieldId);
    if (!field || field.type !== "NUMBER") {
      return true;
    }

    const referencingFields = petitionFields.filter((f) =>
      f.math?.some((m) =>
        m.operations.some((op) => op.operand.type === "FIELD" && op.operand.fieldId === fieldId),
      ),
    );

    if (referencingFields.length > 0) {
      throw new ApolloError(
        "The petition field is being referenced on math operations of another field.",
        "FIELD_IS_REFERENCED_ERROR",
        {
          referencingFieldIds: referencingFields.map((f) => toGlobalId("PetitionField", f.id)),
        },
      );
    }

    return true;
  };
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
    const petitionId = args[petitionIdArg] as unknown as number;
    const fieldIds = unMaybeArray(args[fieldIdArg] as unknown as MaybeArray<number>);

    const petitionFields = await ctx.petitions.loadAllFieldsByPetitionId(petitionId);

    for (const fieldId of fieldIds) {
      const field = petitionFields.find((f) => f.id === fieldId);
      if (!field) {
        continue;
      }

      if (field.type === "SHORT_TEXT" || field.type === "DATE") {
        if (
          petitionFields.some(
            (f) =>
              f.type === "BACKGROUND_CHECK" &&
              isNonNullish(f.options.autoSearchConfig) &&
              ((f.options.autoSearchConfig.name as number[]).includes(field.id) ||
                (f.options.autoSearchConfig.date as number | null) === field.id),
          )
        ) {
          throw new ApolloError(
            `PetitionField ${toGlobalId(
              "PetitionField",
              fieldId,
            )} is being referenced on an autoSearchConfig`,
            "FIELD_IS_BEING_REFERENCED_IN_AUTO_SEARCH_CONFIG",
            { fieldId: toGlobalId("PetitionField", fieldId) },
          );
        }
      }
    }

    return true;
  };
}
