import { gql } from "@apollo/client";
import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { OrganizationFeaturesTab } from "@parallel/components/admin-support/OrganizationFeaturesTab";
import { OrganizationUsersTab } from "@parallel/components/admin-support/OrganizationUsersTab";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  OrganizationMembers_organizationDocument,
  OrganizationMembers_userDocument,
  OrganizationUsers_OrderBy,
} from "@parallel/graphql/__types";
import {
  useAssertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { FormattedMessage } from "react-intl";

const SORTING = ["fullName", "email", "createdAt", "lastActiveAt"] as const;

export const USERS_QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

type OrganizationMembersProps = UnwrapPromise<
  ReturnType<typeof OrganizationMembers.getInitialProps>
>;

function OrganizationMembers({ organizationId }: OrganizationMembersProps) {
  const [state] = useQueryState(USERS_QUERY_STATE);
  const sections = useAdminSections();

  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationMembers_userDocument);

  const { data, loading, refetch } = useAssertQueryOrPreviousData(
    OrganizationMembers_organizationDocument,
    {
      variables: {
        id: organizationId,
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [`${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy],
      },
    }
  );
  const organization = data.organization!;
  const users = organization.users.items;

  return (
    <SettingsLayout
      title={organization?.name ?? ""}
      basePath="/app/admin/organizations"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
      header={
        <Heading as="h3" size="md">
          {organization?.name ?? ""}
        </Heading>
      }
      showBackButton={true}
    >
      <Tabs variant="enclosed">
        <TabList paddingLeft={6} background="white" paddingTop={2}>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage id="page.oganizations.users" defaultMessage="Users" />
          </Tab>
          <Tab
            fontWeight="500"
            _selected={{
              backgroundColor: "gray.50",
              borderColor: "gray.200",
              borderBottom: "1px solid transparent",
              color: "blue.600",
            }}
          >
            <FormattedMessage id="page.oganizations.features" defaultMessage="Features" />
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel padding={0}>
            <OrganizationUsersTab
              myId={me.id}
              organization={organization}
              users={users}
              totalCount={organization.users.totalCount}
              isLoading={loading}
              refetch={refetch}
            />
          </TabPanel>
          <TabPanel padding={4}>
            <OrganizationFeaturesTab organization={organization} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SettingsLayout>
  );
}

OrganizationMembers.fragments = {
  get OrganizationUser() {
    return gql`
      fragment OrganizationMembers_OrganizationUser on User {
        id
        ...OrganizationUsersTab_OrganizationUser
      }
      ${OrganizationUsersTab.fragments.OrganizationUser}
    `;
  },
  get Organization() {
    return gql`
      fragment OrganizationMembers_Organization on Organization {
        id
        name
        ...OrganizationUsersTab_Organization
        ...OrganizationFeaturesTab_Organization
      }
      ${OrganizationUsersTab.fragments.Organization}
      ${OrganizationFeaturesTab.fragments.Organization}
    `;
  },
};

const _queries = [
  gql`
    query OrganizationMembers_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
  gql`
    query OrganizationMembers_organization(
      $id: GID!
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [OrganizationUsers_OrderBy!]
    ) {
      organization(id: $id) {
        ...OrganizationMembers_Organization
        users(
          offset: $offset
          limit: $limit
          search: $search
          sortBy: $sortBy
          includeInactive: true
        ) {
          totalCount
          items {
            ...OrganizationMembers_OrganizationUser
          }
        }
      }
    }
    ${OrganizationMembers.fragments.OrganizationUser}
    ${OrganizationMembers.fragments.Organization}
  `,
];

OrganizationMembers.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(query, USERS_QUERY_STATE);
  await Promise.all([
    fetchQuery(OrganizationMembers_organizationDocument, {
      variables: {
        id: query!.organizationId as string,
        offset: items * (page - 1),
        limit: items,
        search,
        sortBy: [`${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy],
      },
    }),
    fetchQuery(OrganizationMembers_userDocument),
  ]);
  return { organizationId: query.organizationId as string };
};

export default compose(withSuperAdminAccess, withDialogs, withApolloData)(OrganizationMembers);
