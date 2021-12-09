import { OrganizationRole } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useOrganizationRoles() {
  const intl = useIntl();
  return useMemo<{ role: OrganizationRole; label: string }[]>(
    () => [
      {
        role: "OWNER",
        label: intl.formatMessage({ id: "organization-role.owner", defaultMessage: "Owner" }),
      },
      {
        role: "ADMIN",
        label: intl.formatMessage({ id: "organization-role.admin", defaultMessage: "Admin" }),
      },
      {
        role: "NORMAL",
        label: intl.formatMessage({
          id: "organization-role.normal",
          defaultMessage: "Normal",
        }),
      },
      {
        role: "COLLABORATOR",
        label: intl.formatMessage({
          id: "organization-role.collaborator",
          defaultMessage: "Collaborator",
        }),
      },
    ],
    []
  );
}
