import { gql, useMutation } from "@apollo/client";
import { Badge, Button, HStack } from "@chakra-ui/react";
import { AdminSettingsLayout } from "@parallel/components/layout/AdminSettingsLayout";
import {
  AdminOrganizationsLayout_OrganizationFragment,
  AdminOrganizationsLayout_QueryFragment,
  AdminOrganizationsLayout_updateOrganizationDocument,
  OrganizationStatus,
} from "@parallel/graphql/__types";
import { ReactNode, useMemo } from "react";
import { useIntl } from "react-intl";
import { EditableHeading } from "../common/EditableHeading";
import { SettingsTabsInnerLayout } from "../layout/SettingsTabsInnerLayout";
import { useOrganizationStatusDialog } from "./dialogs/OrganizationStatusDialog";

type AdminOrganizationsSection = "users" | "features" | "subscriptions";

interface AdminOrganizationsLayoutProps {
  queryObject: AdminOrganizationsLayout_QueryFragment;
  currentTabKey: AdminOrganizationsSection;
  organization: AdminOrganizationsLayout_OrganizationFragment;
  children: ReactNode;
}

export function AdminOrganizationsLayout({
  currentTabKey,
  queryObject,
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

  const [updateOrganization] = useMutation(AdminOrganizationsLayout_updateOrganizationDocument);
  const handleChangeOrgName = async (name: string) => {
    if (name.trim() && organization.name.trim() !== name.trim()) {
      await updateOrganization({
        variables: {
          orgId: organization.id,
          data: {
            name: name.trim(),
          },
        },
      });
    }
  };

  const showOrganizationStatusDialog = useOrganizationStatusDialog();

  const handleChangeOrgStatus = async () => {
    try {
      const { status } = await showOrganizationStatusDialog({ status: organization.status });

      await updateOrganization({
        variables: {
          orgId: organization.id,
          data: {
            status,
          },
        },
      });
    } catch {}
  };

  return (
    <AdminSettingsLayout
      title={`${organization.name} | ${currentTab.title}`}
      basePath="/app/admin/organizations"
      queryObject={queryObject}
      header={
        <HStack>
          <Badge
            height="auto"
            padding={1}
            as={Button}
            isDisabled={organization.status === "ROOT"}
            onClick={handleChangeOrgStatus}
            colorScheme={
              (
                {
                  DEV: "gray",
                  DEMO: "yellow",
                  ACTIVE: "green",
                  CHURNED: "red",
                  INACTIVE: "red",
                } as Record<OrganizationStatus, string>
              )[organization.status]
            }
          >
            {organization.status}
          </Badge>
          <EditableHeading value={organization.name} onChange={handleChangeOrgName} />
        </HStack>
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
        status
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

const _mutations = [
  gql`
    mutation AdminOrganizationsLayout_updateOrganization(
      $orgId: GID!
      $data: OrganizationUpdateInput!
    ) {
      updateOrganization(orgId: $orgId, data: $data) {
        ...AdminOrganizationsLayout_Organization
      }
    }
    ${AdminOrganizationsLayout.fragments.Organization}
  `,
];
