import { User } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { isAdmin } from "./roles";

export function useOrganizationSections(user: Pick<User, "role">) {
  const userIsAdmin = isAdmin(user);
  const intl = useIntl();
  return useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: "organization.users.title",
          defaultMessage: "Users",
        }),
        path: "/app/organization/users",
      },
      {
        title: intl.formatMessage({
          id: "view.groups.title",
          defaultMessage: "Teams",
        }),
        path: "/app/organization/groups",
      },
      ...(userIsAdmin
        ? [
            {
              title: intl.formatMessage({
                id: "organization.branding.title",
                defaultMessage: "Branding",
              }),
              path: "/app/organization/branding",
            },
            {
              title: intl.formatMessage({
                id: "organization.usage.title",
                defaultMessage: "Usage",
              }),
              path: "/app/organization/usage",
            },
            {
              title: intl.formatMessage({
                id: "organization.integrations.title",
                defaultMessage: "Integrations",
              }),
              path: "/app/organization/integrations",
            },
          ]
        : []),
    ],
    [intl.locale, userIsAdmin]
  );
}
