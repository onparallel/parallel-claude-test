import { core } from "nexus";
import { difference, uniqBy } from "remeda";
import { UserGroupPermissionNameValues } from "../../db/__types";
import { NexusGenInputs } from "../__types";
import { ArgValidationError } from "../helpers/errors";
import { FieldValidateArgsResolver } from "../helpers/validateArgsPlugin";

export function validUserGroupPermissionsInput<TypeName extends string, FieldName extends string>(
  userGroupIdProp: (args: core.ArgsValue<TypeName, FieldName>) => number,
  permissionsProp: (
    args: core.ArgsValue<TypeName, FieldName>,
  ) => NexusGenInputs["UpdateUserGroupPermissionsInput"][],
  argName: string,
) {
  return (async (_, args, ctx, info) => {
    const permissions = permissionsProp(args);

    const uniqueByName = uniqBy(permissions, (p) => p.name);
    if (permissions.length !== uniqueByName.length) {
      throw new ArgValidationError(info, argName, "Duplicate permissions");
    }

    if (permissions.some((p) => p.name === "SUPERADMIN")) {
      const userGroupId = userGroupIdProp(args);
      const userGroup = (await ctx.userGroups.loadUserGroup(userGroupId))!;
      const organization = (await ctx.organizations.loadOrg(userGroup.org_id))!;

      if (organization.status !== "ROOT") {
        throw new ArgValidationError(info, argName, `Unknown permissions: SUPERADMIN`);
      }
    }

    const unknownNames = difference(
      permissions.map((p) => p.name),
      UserGroupPermissionNameValues,
    );

    if (unknownNames.length > 0) {
      throw new ArgValidationError(
        info,
        argName,
        `Unknown permissions: ${unknownNames.join(", ")}`,
      );
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
