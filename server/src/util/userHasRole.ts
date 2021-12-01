import { User, UserOrganizationRole, UserOrganizationRoleValues } from "../db/__types";

export function userHasRole(user: Pick<User, "organization_role">, role: UserOrganizationRole) {
  const roleIndex = UserOrganizationRoleValues.findIndex((r) => r === role);
  const userRoleIndex = UserOrganizationRoleValues.findIndex((r) => r === user.organization_role);
  return userRoleIndex >= roleIndex;
}
