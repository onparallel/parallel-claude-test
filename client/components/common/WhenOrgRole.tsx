import { gql, useQuery } from "@apollo/client";
import { OrganizationRole, WhenOrgRoleDocument } from "@parallel/graphql/__types";
import { isAtLeast } from "@parallel/utils/roles";
import { ReactNode } from "react";

interface WhenOrgRoleProps {
  role: OrganizationRole;
  children: ReactNode | ((hasRole: boolean) => ReactNode);
}

export function WhenOrgRole({ role, children }: WhenOrgRoleProps) {
  const { data } = useQuery(WhenOrgRoleDocument);
  const hasRole = data ? isAtLeast(role, data.me) : false;
  if (typeof children === "function") {
    return children(hasRole);
  } else {
    return hasRole ? children : null;
  }
}

WhenOrgRole.queries = [
  gql`
    query WhenOrgRole {
      me {
        role
      }
    }
  `,
];
