import { User, UserOrganizationRole, UserOrganizationRoleValues as roles } from "../db/__types";

export function userHasRole(user: Pick<User, "organization_role">, role: UserOrganizationRole) {
  return roles.indexOf(user.organization_role) >= roles.indexOf(role);
}
