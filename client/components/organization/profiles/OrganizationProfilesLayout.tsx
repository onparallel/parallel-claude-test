import { gql } from "@apollo/client";
import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { NakedLink } from "@parallel/components/common/Link";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { OrganizationProfilesLayout_QueryFragment } from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type ProfilesOrganizationSection = "types" | "relationships";

interface OrganizationProfilesLayoutProps extends OrganizationProfilesLayout_QueryFragment {
  tabKey: ProfilesOrganizationSection;
  children: ReactNode;
}

export function OrganizationProfilesLayout({
  tabKey,
  me,
  realMe,
  children,
}: OrganizationProfilesLayoutProps) {
  const router = useRouter();
  const tabs = useProfilesOrganizationTabs();
  const currentTab = tabs.find((t) => t.key === tabKey)!;

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
      <Tabs
        variant="enclosed"
        index={tabs.findIndex((t) => t.key === tabKey)!}
        onChange={(index) => {
          if (index >= 0) {
            router.push(`/app/organization/profiles/${tabs[index].key}`);
          }
        }}
      >
        <TabList paddingLeft={6} background="white" paddingTop={2}>
          {tabs.map(({ key, title, isDisabled }) =>
            isDisabled ? (
              <Tab key={key} fontWeight="500" color="gray.400" cursor="not-allowed" isDisabled>
                {title}
              </Tab>
            ) : (
              <NakedLink key={key} href={`/app/organization/profiles/${key}`}>
                <Tab
                  as="a"
                  fontWeight="500"
                  _selected={{
                    backgroundColor: "gray.50",
                    borderColor: "gray.200",
                    borderBottom: "1px solid transparent",
                    color: "blue.600",
                  }}
                >
                  {title}
                </Tab>
              </NakedLink>
            )
          )}
        </TabList>
        <TabPanels>
          {tabs.map((t) => (
            <TabPanel padding={0} key={t.key}>
              {t.key === tabKey ? children : null}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </OrganizationSettingsLayout>
  );
}

function useProfilesOrganizationTabs() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "types" as const,
        title: intl.formatMessage({
          id: "organization.profiles.profile-types",
          defaultMessage: "Profile types",
        }),
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
    [intl.locale]
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
