import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { SettingsTabsInnerLayout } from "@parallel/components/layout/SettingsTabsInnerLayout";
import { OrganizationProfilesLayout_QueryFragment } from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type ProfilesOrganizationSection = "types" | "relationships";

interface OrganizationProfilesLayoutProps {
  queryObject: OrganizationProfilesLayout_QueryFragment;
  currentTabKey: ProfilesOrganizationSection;
  children: ReactNode;
}

export function OrganizationProfilesLayout({
  currentTabKey,
  queryObject,
  children,
}: OrganizationProfilesLayoutProps) {
  const intl = useIntl();
  const tabs = useMemo(
    () => [
      {
        key: "types" as const,
        title: intl.formatMessage({
          id: "component.organization-profiles-layout.profile-types",
          defaultMessage: "Profile types",
        }),
        href: "/app/organization/profiles/types",
      },
      {
        key: "relationships" as const,
        title: intl.formatMessage({
          id: "component.organization-profiles-layout.relationships",
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
      queryObject={queryObject}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage
            id="component.organization-profiles-layout.title"
            defaultMessage="Profiles"
          />
        </Heading>
      }
    >
      <SettingsTabsInnerLayout tabs={tabs} currentTabKey={currentTabKey}>
        {children}
      </SettingsTabsInnerLayout>
    </OrganizationSettingsLayout>
  );
}

const _fragments = {
  Query: gql`
    fragment OrganizationProfilesLayout_Query on Query {
      ...OrganizationSettingsLayout_Query
    }
  `,
};
