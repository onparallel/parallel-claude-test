import { gql } from "@apollo/client";
import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { AdminSettingsLayout } from "@parallel/components/layout/AdminSettingsLayout";
import {
  AdminOrganizationsLayout_OrganizationFragment,
  AdminOrganizationsLayout_QueryFragment,
} from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { NakedLink } from "../common/Link";

type AdminOrganizationsSection = "users" | "features" | "subscriptions";

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
  const tabs = useAdminOrganizationsTabs();
  const currentTab = tabs.find((t) => t.key === tabKey)!;

  return (
    <AdminSettingsLayout
      title={`${organization.name} | ${currentTab.title}`}
      basePath="/app/admin/organizations"
      me={me}
      realMe={realMe}
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
    </AdminSettingsLayout>
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
        key: "subscriptions" as const,
        title: intl.formatMessage({
          id: "component.admin-organizations-tabs.subscriptions",
          defaultMessage: "Subscriptions",
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
        ...AdminSettingsLayout_Query
        me {
          id
          organization {
            ...AdminOrganizationsLayout_Organization
          }
        }
      }
      ${AdminSettingsLayout.fragments.Query}
      ${AdminOrganizationsLayout.fragments.Organization}
    `;
  },
};
