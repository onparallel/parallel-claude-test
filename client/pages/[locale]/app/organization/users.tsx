import { gql } from "@apollo/client";
import { Box, Button, Stack, useToast } from "@chakra-ui/react";
import { RepeatIcon, UserPlusIcon } from "@parallel/chakra/icons";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { Spacer } from "@parallel/components/common/Spacer";
import { TablePage } from "@parallel/components/common/TablePage";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useCreateUserDialog } from "@parallel/components/organization/CreateUserDialog";
import {
  OrganizationUsersQuery,
  OrganizationUsers_OrderBy,
  useOrganizationUsersQuery,
  useOrganizationUsers_createOrganizationUserMutation,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useOrganizationUsersTableColumns } from "@parallel/utils/useOrganizationUsersTableColumns";
import { ChangeEvent, useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const PAGE_SIZE = 10;

const SORTING = [
  "firstName",
  "lastName",
  "email",
  "createdAt",
  "lastActiveAt",
] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

function OrganizationUsers() {
  const intl = useIntl();
  const toast = useToast();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: { me },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useOrganizationUsersQuery({
      variables: {
        offset: PAGE_SIZE * (state.page - 1),
        limit: PAGE_SIZE,
        search: state.search,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as OrganizationUsers_OrderBy,
        ],
      },
    })
  );

  const userList = me.organization.users;

  const sections = useOrganizationSections();

  const columns = useOrganizationUsersTableColumns();
  const [search, setSearch] = useState(state.search);

  const debouncedOnSearchChange = useDebouncedCallback(
    (value) => {
      setQueryState((current) => ({
        ...current,
        search: value,
        page: 1,
      }));
    },
    300,
    [setQueryState]
  );
  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const [
    createOrganizationUser,
  ] = useOrganizationUsers_createOrganizationUserMutation();
  const showCreateUserDialog = useCreateUserDialog();
  const handleCreateUser = async () => {
    try {
      const { email, firstName, lastName, role } = await showCreateUserDialog(
        {}
      );
      await createOrganizationUser({
        variables: {
          email,
          firstName,
          lastName,
          role,
        },
        update() {
          refetch();
        },
      });
      toast({
        title: intl.formatMessage({
          id: "generic.success",
          defaultMessage: "Success",
        }),
        description: "User created successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.users.title",
        defaultMessage: "Users",
      })}
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage
          id="organization.title"
          defaultMessage="Organization"
        />
      }
      header={
        <FormattedMessage
          id="organization.users.title"
          defaultMessage="Users"
        />
      }
    >
      <Box flex="1" padding={4}>
        <TablePage
          columns={columns}
          rows={userList.items}
          rowKeyProp={"id"}
          isHighlightable
          loading={loading}
          page={state.page}
          pageSize={PAGE_SIZE}
          totalCount={userList.totalCount}
          sort={state.sort}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <Stack direction="row" padding={2}>
              <Box flex="0 1 400px">
                <SearchInput
                  value={search ?? ""}
                  onChange={handleSearchChange}
                />
              </Box>
              <IconButtonWithTooltip
                onClick={() => refetch()}
                icon={<RepeatIcon />}
                placement="bottom"
                variant="outline"
                label={intl.formatMessage({
                  id: "generic.reload-data",
                  defaultMessage: "Reload",
                })}
              />
              <Spacer />
              <Button
                colorScheme="purple"
                leftIcon={<UserPlusIcon fontSize="18px" />}
                onClick={handleCreateUser}
              >
                {intl.formatMessage({
                  id: "organization.create-user-button",
                  defaultMessage: "Create user",
                })}
              </Button>
            </Stack>
          }
        />
      </Box>
    </SettingsLayout>
  );
}

OrganizationUsers.fragments = {
  get User() {
    return gql`
      fragment OrganizationUsers_User on User {
        id
        firstName
        lastName
        email
        role
        createdAt
        lastActiveAt
      }
    `;
  },
};

OrganizationUsers.mutations = [
  gql`
    mutation OrganizationUsers_createOrganizationUser(
      $firstName: String!
      $lastName: String!
      $email: String!
      $role: OrganizationRole!
    ) {
      createOrganizationUser(
        email: $email
        firstName: $firstName
        lastName: $lastName
        role: $role
      ) {
        ...OrganizationUsers_User
      }
    }
    ${OrganizationUsers.fragments.User}
  `,
];

OrganizationUsers.getInitialProps = async ({
  fetchQuery,
  ...context
}: WithApolloDataContext) => {
  const { page, search, sort } = parseQuery(context.query, QUERY_STATE);
  await fetchQuery<OrganizationUsersQuery>(
    gql`
      query OrganizationUsers(
        $offset: Int!
        $limit: Int!
        $search: String
        $sortBy: [OrganizationUsers_OrderBy!]
      ) {
        me {
          ...AppLayout_User
          organization {
            id
            users(
              offset: $offset
              limit: $limit
              search: $search
              sortBy: $sortBy
            ) {
              totalCount
              items {
                ...OrganizationUsers_User
              }
            }
          }
        }
      }
      ${AppLayout.fragments.User}
      ${OrganizationUsers.fragments.User}
    `,
    {
      variables: {
        offset: PAGE_SIZE * (page - 1),
        limit: PAGE_SIZE,
        search,
        sortBy: [
          `${sort.field}_${sort.direction}` as OrganizationUsers_OrderBy,
        ],
      },
    }
  );
};

export default compose(
  withAdminOrganizationRole,
  withDialogs,
  withApolloData
)(OrganizationUsers);
