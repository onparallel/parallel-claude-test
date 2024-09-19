import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { SettingsTabsInnerLayout } from "@parallel/components/layout/SettingsTabsInnerLayout";
import { OrganizationProfilesLayout_QueryFragment } from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type ProfilesOrganizationSection = "types" | "relationships";

interface OrganizationProfilesLayoutProps
  extends Pick<OrganizationProfilesLayout_QueryFragment, "me" | "realMe"> {
  currentTabKey: ProfilesOrganizationSection;
  children: ReactNode;
}

export function OrganizationProfilesLayout({
  currentTabKey,
  me,
  realMe,
  children,
}: OrganizationProfilesLayoutProps) {
  const intl = useIntl();
  const tabs = useMemo(
    () => [
      {
        key: "types" as const,
        title: intl.formatMessage({
          id: "organization.profiles.profile-types",
          defaultMessage: "Profile types",
        }),
        href: "/app/organization/profiles/types",
      },
      {
        key: "relationships" as const,
        title: intl.formatMessage({
          id: "organization.profiles.relationships",
          defaultMessage: "Relationships",
        }),
        isDisabled: true,
      },
    ],
    [intl.locale],
  );
  const currentTab = tabs.find((t) => t.key === currentTabKey)!;

  return (
    <OrganizationSettingsLayout
      title={`${currentTab.title}`}
      me={me}
      realMe={realMe}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="organization.profiles.title" defaultMessage="Profiles" />
        </Heading>
      }
    >
      <SettingsTabsInnerLayout tabs={tabs} currentTabKey={currentTabKey}>
        {children}
      </SettingsTabsInnerLayout>
    </OrganizationSettingsLayout>
  );
}

OrganizationProfilesLayout.fragments = {
  get Query() {
    return gql`
      fragment OrganizationProfilesLayout_Query on Query {
        ...OrganizationSettingsLayout_Query
      }
      ${OrganizationSettingsLayout.fragments.Query}
    `;
  },
};
