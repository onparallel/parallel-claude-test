import { gql } from "@apollo/client";
import { roles_UserFragment, OrganizationRole } from "@parallel/graphql/__types";

const ROLES = ["OWNER", "ADMIN", "NORMAL", "COLLABORATOR"] as OrganizationRole[];

export function isAdmin(user: roles_UserFragment) {
  return isAtLeast("ADMIN", user);
}

export function isAtLeast(role: OrganizationRole, user: roles_UserFragment) {
  return ROLES.indexOf(role) >= ROLES.indexOf(user.role);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fragments = {
  User: gql`
    fragment roles_User on User {
      role
    }
  `,
};
