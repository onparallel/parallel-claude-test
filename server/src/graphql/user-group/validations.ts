import { difference, uniqueBy } from "remeda";
import { UserGroupPermissionNameValues } from "../../db/__types";
import { NexusGenInputs } from "../__types";
import { ArgWithPath, getArgWithPath } from "../helpers/authorize";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validUserGroupPermissionsInput<TypeName extends string, FieldName extends string>(
  prop: ArgWithPath<TypeName, FieldName, NexusGenInputs["UpdateUserGroupPermissionsInput"][]>,
  userGroupIdProp: ArgWithPath<TypeName, FieldName, number>,
) {
  return (async (_, args, ctx, info) => {
    const [permissions, argName] = getArgWithPath(args, prop);

    const uniqueByName = uniqueBy(permissions, (p) => p.name);
    if (permissions.length !== uniqueByName.length) {
      throw new ArgValidationError(info, argName, "Duplicate permissions");
    }

    const unknownNames = difference(
      permissions.map((p) => p.name),
      UserGroupPermissionNameValues,
    );

    if (permissions.some((p) => p.name === "SUPERADMIN")) {
      const [userGroupId] = getArgWithPath(args, userGroupIdProp);
      const userGroup = (await ctx.userGroups.loadUserGroup(userGroupId))!;
      const organization = (await ctx.organizations.loadOrg(userGroup.org_id))!;

      if (organization.status !== "ROOT") {
        unknownNames.push("SUPERADMIN");
      }
    }

    if (permissions.some((p) => p.name === "PETITIONS:SEND_ON_BEHALF")) {
      const hasSendOnBehalfAccess = await ctx.featureFlags.userHasFeatureFlag(
        ctx.user!.id,
        "ON_BEHALF_OF",
      );

      if (!hasSendOnBehalfAccess) {
        unknownNames.push("PETITIONS:SEND_ON_BEHALF");
      }
    }

    const profilesPermissions = permissions.filter(
      (p) =>
        p.name.startsWith("PROFILE_TYPES:") ||
        p.name.startsWith("PROFILES:") ||
        p.name.startsWith("PROFILE_ALERTS:"),
    );

    if (profilesPermissions.length > 0) {
      const hasProfilesAccess = await ctx.featureFlags.userHasFeatureFlag(ctx.user!.id, "PROFILES");
      if (!hasProfilesAccess) {
        unknownNames.push(...profilesPermissions.map((p) => p.name));
      }
    }

    if (permissions.some((p) => p.name === "USERS:GHOST_LOGIN")) {
      const hasGhostLoginAccess = await ctx.featureFlags.userHasFeatureFlag(
        ctx.user!.id,
        "GHOST_LOGIN",
      );
      if (!hasGhostLoginAccess) {
        unknownNames.push("USERS:GHOST_LOGIN");
      }
    }

    const dashboardPermissions = permissions.filter((p) => p.name.startsWith("DASHBOARDS:"));
    if (dashboardPermissions.length > 0) {
      const hasDashboardsAccess = await ctx.featureFlags.userHasFeatureFlag(
        ctx.user!.id,
        "DASHBOARDS",
      );
      if (!hasDashboardsAccess) {
        unknownNames.push(...dashboardPermissions.map((p) => p.name));
      }
    }

    if (unknownNames.length > 0) {
      throw new ArgValidationError(
        info,
        argName,
        `Unknown permissions: ${unknownNames.join(", ")}`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
