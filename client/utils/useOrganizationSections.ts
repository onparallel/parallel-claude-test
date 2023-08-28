import { gql } from "@apollo/client";
import { useOrganizationSections_UserFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useHasPermission } from "./useHasPermission";

export function useOrganizationSections(user: useOrganizationSections_UserFragment) {
  const userOrganizationPermissions = useHasPermission("ORG_SETTINGS");
  const userHasProfilesTypesPermissions = useHasPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES");
  const userCanViewUsers = useHasPermission("USERS:LIST_USERS");
  const userCanViewGroups = useHasPermission("TEAMS:LIST_TEAMS");

  const intl = useIntl();
  return useMemo(
    () => [
      ...(userCanViewUsers
        ? [
            {
              title: intl.formatMessage({
                id: "organization.users.title",
                defaultMessage: "Users",
              }),
              path: "/app/organization/users",
            },
          ]
        : []),
      ...(userCanViewGroups
        ? [
            {
              title: intl.formatMessage({
                id: "page.groups.title",
                defaultMessage: "Teams",
              }),
              path: "/app/organization/groups",
            },
          ]
        : []),
      {
        title: intl.formatMessage({
          id: "organization.general.title",
          defaultMessage: "General",
        }),
        path: "/app/organization/general",
      },
      ...(user.hasProfilesAccess && userHasProfilesTypesPermissions
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
      ...(userOrganizationPermissions
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
    [
      intl.locale,
      userOrganizationPermissions,
      userCanViewUsers,
      userCanViewGroups,
      userHasProfilesTypesPermissions,
      user.hasProfilesAccess,
    ],
  );
}

useOrganizationSections.fragments = {
  User: gql`
    fragment useOrganizationSections_User on User {
      hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
    }
  `,
};
