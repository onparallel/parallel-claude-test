import { gql } from "@apollo/client";
import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  AdminOrganizationsLayout_QueryFragment,
  AdminOrganizationsLayout_OrganizationFragment,
} from "@parallel/graphql/__types";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { useRouter } from "next/router";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";

type AdminOrganizationsSection = "users" | "features";

interface AdminOrganizationsLayoutProps extends AdminOrganizationsLayout_QueryFragment {
  tabKey: AdminOrganizationsSection;
  organization: AdminOrganizationsLayout_OrganizationFragment;
  children: ReactNode;
}

export function AdminOrganizationsLayout({
  tabKey,
  me,
  realMe,
  children,
  organization,
}: AdminOrganizationsLayoutProps) {
  const router = useRouter();
  const adminSections = useAdminSections();
  const tabs = useAdminOrganizationsTabs();
  const currentTab = tabs.find((t) => t.key === tabKey)!;
  const currentTabRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    setTimeout(() => currentTabRef.current?.focus());
  }, []);

  return (
    <SettingsLayout
      title={`${organization.name} | ${currentTab.title}`}
      basePath="/app/admin/organizations"
      sections={adminSections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
      header={
        <Heading as="h3" size="md">
          {organization.name}
        </Heading>
      }
      showBackButton={true}
    >
      <Tabs
        variant="enclosed"
        index={tabs.findIndex((t) => t.key === tabKey)!}
        onChange={(index) => {
          if (index >= 0) {
            router.push(`/app/admin/organizations/${organization.id}/${tabs[index].key}`);
          }
        }}
      >
        <TabList paddingLeft={6} background="white" paddingTop={2}>
          {tabs.map((t) => (
            <NakedLink key={t.key} href={`/app/admin/organizations/${organization.id}/${t.key}`}>
              <Tab
                as="a"
                ref={t.key === tabKey ? (currentTabRef as any) : undefined}
                fontWeight="500"
                _selected={{
                  backgroundColor: "gray.50",
                  borderColor: "gray.200",
                  borderBottom: "1px solid transparent",
                  color: "blue.600",
                }}
              >
                {t.title}
              </Tab>
            </NakedLink>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map((t) => (
            <TabPanel padding={0} key={t.key}>
              {t.key === tabKey ? children : null}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </SettingsLayout>
  );
}

function useAdminOrganizationsTabs() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "users" as const,
        title: intl.formatMessage({
          id: "component.admin-organizations-tabs.users",
          defaultMessage: "Users",
        }),
      },
      {
        key: "features" as const,
        title: intl.formatMessage({
          id: "component.admin-organizations-tabs.features",
          defaultMessage: "Features",
        }),
      },
    ],
    [intl.locale]
  );
}

AdminOrganizationsLayout.fragments = {
  get Organization() {
    return gql`
      fragment AdminOrganizationsLayout_Organization on Organization {
        id
        name
      }
    `;
  },
  get Query() {
    return gql`
      fragment AdminOrganizationsLayout_Query on Query {
        ...SettingsLayout_Query
        me {
          organization {
            name
            ...AdminOrganizationsLayout_Organization
          }
        }
      }
      ${SettingsLayout.fragments.Query}
      ${AdminOrganizationsLayout.fragments.Organization}
    `;
  },
};
