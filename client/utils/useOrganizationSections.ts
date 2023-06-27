import { gql } from "@apollo/client";
import { useOrganizationSections_UserFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { isAdmin } from "./roles";

export function useOrganizationSections(user: useOrganizationSections_UserFragment) {
  const userIsAdmin = isAdmin(user.role);
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
      {
        title: intl.formatMessage({
          id: "organization.general.title",
          defaultMessage: "General",
        }),
        path: "/app/organization/general",
      },
      ...(user.hasProfilesAccess && userIsAdmin
        ? [
            {
              title: intl.formatMessage({
                id: "organization.profiles.title",
                defaultMessage: "Profiles",
              }),
              path: "/app/organization/profiles/types",
            },
          ]
        : []),
      {
        title: intl.formatMessage({
          id: "organization.branding.title",
          defaultMessage: "Branding",
        }),
        path: "/app/organization/branding",
      },
      ...(userIsAdmin
        ? [
            {
              title: intl.formatMessage({
                id: "organization.usage.title",
                defaultMessage: "Usage",
              }),
              path: "/app/organization/usage",
            },
            {
              title: intl.formatMessage({
                id: "organization.compliance.title",
                defaultMessage: "Compliance",
              }),
              path: "/app/organization/compliance",
            },
          ]
        : []),
      {
        title: intl.formatMessage({
          id: "organization.integrations.title",
          defaultMessage: "Integrations",
        }),
        path: "/app/organization/integrations",
      },
    ],
    [intl.locale, userIsAdmin]
  );
}

useOrganizationSections.fragments = {
  User: gql`
    fragment useOrganizationSections_User on User {
      role
      hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
    }
  `,
};
