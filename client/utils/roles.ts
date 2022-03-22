import { gql, useQuery } from "@apollo/client";
import { OrganizationRole, useOrgRole_MeDocument } from "@parallel/graphql/__types";

const ROLES = ["OWNER", "ADMIN", "NORMAL", "COLLABORATOR"] as OrganizationRole[];

export function isAdmin(userRole: OrganizationRole) {
  return isAtLeast("ADMIN", userRole);
}

export function isAtLeast(role: OrganizationRole, userRole: OrganizationRole) {
  return ROLES.indexOf(role) >= ROLES.indexOf(userRole);
}

export function useOrgRole() {
  const { data } = useQuery(useOrgRole_MeDocument);
  return data?.me.role ?? null;
}

useOrgRole.queries = [
  gql`
    query useOrgRole_Me {
      me {
        role
      }
    }
  `,
];
