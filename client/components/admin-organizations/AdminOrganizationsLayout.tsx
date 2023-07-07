import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import { AdminSettingsLayout } from "@parallel/components/layout/AdminSettingsLayout";
import {
  AdminOrganizationsLayout_OrganizationFragment,
  AdminOrganizationsLayout_QueryFragment,
} from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { SettingsTabsInnerLayout } from "../layout/SettingsTabsInnerLayout";

type AdminOrganizationsSection = "users" | "features" | "subscriptions";

interface AdminOrganizationsLayoutProps extends AdminOrganizationsLayout_QueryFragment {
  currentTabKey: AdminOrganizationsSection;
  organization: AdminOrganizationsLayout_OrganizationFragment;
  children: ReactNode;
}

export function AdminOrganizationsLayout({
  currentTabKey,
  me,
  realMe,
  children,
  organization,
}: AdminOrganizationsLayoutProps) {
  const intl = useIntl();
  const tabs = useMemo(
    () => [
      {
        key: "users" as const,
        title: intl.formatMessage({
          id: "component.admin-organizations-tabs.users",
          defaultMessage: "Users",
        }),
        href: `/app/admin/organizations/${organization.id}/users`,
      },
      {
        key: "subscriptions" as const,
        title: intl.formatMessage({
          id: "component.admin-organizations-tabs.subscriptions",
          defaultMessage: "Subscriptions",
        }),
        href: `/app/admin/organizations/${organization.id}/subscriptions`,
      },
      {
        key: "features" as const,
        title: intl.formatMessage({
          id: "component.admin-organizations-tabs.features",
          defaultMessage: "Features",
        }),
        href: `/app/admin/organizations/${organization.id}/features`,
      },
    ],
    [intl.locale, organization.id],
  );
  const currentTab = tabs.find((t) => t.key === currentTabKey)!;

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
      <SettingsTabsInnerLayout tabs={tabs} currentTabKey={currentTabKey}>
        {children}
      </SettingsTabsInnerLayout>
    </AdminSettingsLayout>
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
