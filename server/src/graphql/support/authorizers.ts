import { FieldAuthorizeResolver } from "@nexus/schema";
import { UserOrganizationRole } from "../../db/__types";

export function userBelongsToOrg<
  TypeName extends string,
  FieldName extends string
>(
  orgIdentifier: string,
  validRoles?: UserOrganizationRole[]
): FieldAuthorizeResolver<TypeName, FieldName> {
  return async (_, args, ctx) => {
    try {
      debugger;
      const user = ctx.user!;
      const org = await ctx.organizations.loadOrg(user.org_id);
      if (org!.identifier === orgIdentifier) {
        return (
          !validRoles ||
          validRoles.length === 0 ||
          validRoles.includes(user.organization_role)
        );
      }
    } catch {}
    return false;
  };
}
