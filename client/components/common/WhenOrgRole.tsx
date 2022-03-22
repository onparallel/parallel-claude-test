import { OrganizationRole } from "@parallel/graphql/__types";
import { isAtLeast, useOrgRole } from "@parallel/utils/roles";
import { ReactNode } from "react";

interface WhenOrgRoleProps {
  role: OrganizationRole;
  children: ReactNode | ((hasRole: boolean) => ReactNode);
}

export function WhenOrgRole({ role, children }: WhenOrgRoleProps) {
  const userRole = useOrgRole();
  const hasRole = userRole ? isAtLeast(role, userRole) : false;
  if (typeof children === "function") {
    return children(hasRole);
  } else {
    return hasRole ? children : null;
  }
}
