import { FieldAuthorizeResolver } from "nexus/dist/plugins/fieldAuthorizePlugin";
import { isDefined, partition } from "remeda";
import { ApiContext } from "../../../context";
import { PetitionPermissionType, UserStatus } from "../../../db/__types";
import { unMaybeArray } from "../../../util/arrays";
import { Maybe, MaybeArray } from "../../../util/types";
import { userHasRole } from "../../../util/userHasRole";
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
      (u) => isDefined(u) && u.org_id === ctx.user!.org_id,
    );
  } catch {}
  return false;
}

export function userHasAccessToUsers<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, MaybeArray<number>>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    const userIds = unMaybeArray(args[argName] as unknown as MaybeArray<number>);
    return contextUserHasAccessToUsers(userIds, ctx);
  };
}

type UserOrUserGroupPermissionInput = NexusGen["inputTypes"]["UserOrUserGroupPermissionInput"];

export function userHasAccessToUserOrUserGroupPermissions<
  TypeName extends string,
  FieldName extends string,
  TArg extends Arg<TypeName, FieldName, UserOrUserGroupPermissionInput[] | null | undefined>,
>(argName: TArg): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      const permissions = args[argName] as unknown as
        | UserOrUserGroupPermissionInput[]
        | null
        | undefined;
      if (!isDefined(permissions)) {
        return true;
      }
      for (const p of permissions) {
        if (Number(isDefined(p.userId)) + Number(isDefined(p.userGroupId)) !== 1) {
          return false;
        }
      }
      const [uPermissions, ugPermissions] = partition(permissions, (p) => isDefined(p.userId));

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

      return (await ctx.users.loadUser(userIds)).every((u) => isDefined(u) && u.status === status);
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
      ).filter(isDefined);

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
    if (!isDefined(senderId) || senderId === ctx.user!.id) {
      return true;
    }
    try {
      const hasFeatureFlag = await ctx.featureFlags.orgHasFeatureFlag(
        ctx.user!.org_id,
        "ON_BEHALF_OF",
      );
      if (!hasFeatureFlag) {
        return false;
      }
      if (userHasRole(ctx.user!, "ADMIN")) {
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
