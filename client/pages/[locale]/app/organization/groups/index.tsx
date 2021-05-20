import { Flex, Heading } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import { FormattedMessage, useIntl } from "react-intl";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/DialogProvider";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { compose } from "@parallel/utils/compose";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { DateTime } from "@parallel/components/common/DateTime";
import { useCallback, useMemo, useRef, useState } from "react";
import { FORMATS } from "@parallel/utils/dates";
import { TablePage } from "@parallel/components/common/TablePage";
import { OrganizationGroupsListTableHeader } from "@parallel/components/organization/OrganizationGroupsListTableHeader";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCreateGroupDialog } from "@parallel/components/organization/CreateGroupDialog";
import { TableColumn } from "@parallel/components/common/Table";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { useRouter } from "next/router";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { Button } from "@chakra-ui/button";
import gql from "graphql-tag";
import {
  assertQuery,
  useAssertQueryOrPreviousData,
} from "@parallel/utils/apollo/assertQuery";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  OrganizationGroupsQuery,
  OrganizationGroupsQueryVariables,
  OrganizationGroupsUserQuery,
  OrganizationGroups_UserGroupFragment,
  QueryUserGroups_OrderBy,
  useOrganizationGroupsQuery,
  useOrganizationGroupsUserQuery,
  useOrganizationGroups_cloneUserGroupMutation,
  useOrganizationGroups_createUserGroupMutation,
  useOrganizationGroups_deleteUserGroupMutation,
} from "@parallel/graphql/__types";

const SORTING = ["name", "members", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

function OrganizationGroups() {
  const intl = useIntl();
  const toast = useToast();
  const localeRef = useRef<string>(intl.locale);
  const router = useRouter();

  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [selected, setSelected] = useState<string[]>([]);

  const {
    data: { me },
  } = assertQuery(useOrganizationGroupsUserQuery());

  const {
    data: { userGroups },
    loading,
    refetch,
  } = useAssertQueryOrPreviousData(
    useOrganizationGroupsQuery({
      variables: {
        offset: state.items * (state.page - 1),
        limit: state.items,
        search: state.search,
        sortBy: [
          `${state.sort.field}_${state.sort.direction}` as QueryUserGroups_OrderBy,
        ],
      },
    })
  );

  const selectedGroups = useMemo(
    () =>
      selected
        .map((groupId) => userGroups.items.find((g) => g.id === groupId)!)
        .filter((u) => u !== undefined),
    [selected.join(","), userGroups.items]
  );

  const [search, setSearch] = useState(state.search);

  const sections = useOrganizationSections();

  const columns = useOrganizationGroupsTableColumns();

  const confirmDelete = useConfirmDeleteGroupsDialog();

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
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const handleRowClick = useCallback(function (row: any) {
    router.push(`/${localeRef.current}/app/organization/groups/${row.id}`);
  }, []);

  const [cloneUserGroup] = useOrganizationGroups_cloneUserGroupMutation();
  const handleCloneClick = useCallback(
    async function () {
      await cloneUserGroup({
        variables: {
          ids: selected,
          locale: intl.locale,
        },
      });
      refetch();
    },
    [userGroups, selected]
  );

  const [deleteUserGroup] = useOrganizationGroups_deleteUserGroupMutation();
  const handleDeleteClick = useCallback(async () => {
    await confirmDelete({ name: selectedGroups[0].name, groupIds: selected });
    await deleteUserGroup({
      variables: {
        ids: selected,
      },
    });
    refetch();
  }, [userGroups, selected]);

  const [createUserGroup] = useOrganizationGroups_createUserGroupMutation();
  const showCreateGroupDialog = useCreateGroupDialog();
  const handleCreateGroup = async () => {
    try {
      const newGroup = await showCreateGroupDialog({});
      await createUserGroup({
        variables: {
          name: newGroup.name,
          userIds: newGroup.users.map((u) => u.id),
        },
      });
      refetch();
      toast({
        title: intl.formatMessage({
          id: "organization.group-created-success.toast-title",
          defaultMessage: "Group created successfully.",
        }),
        description: intl.formatMessage(
          {
            id: "organization.group-created-success.toast-description",
            defaultMessage: "Group {name} succefuly created.",
          },
          { name: newGroup.name }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "organization.groups.title",
        defaultMessage: "Groups",
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
        <Heading as="h3" size="md">
          <FormattedMessage
            id="organization.groups.title"
            defaultMessage="Groups"
          />
        </Heading>
      }
    >
      <Flex
        flexDirection="column"
        flex="1"
        minHeight={0}
        padding={4}
        backgroundColor={"gray.50"}
      >
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable
          isHighlightable
          columns={columns}
          rows={userGroups.items}
          onRowClick={handleRowClick}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={userGroups.totalCount}
          sort={state.sort}
          onSelectionChange={setSelected}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <OrganizationGroupsListTableHeader
              me={me}
              search={search}
              selectedGroups={selectedGroups}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onCreateGroup={handleCreateGroup}
              onCloneGroup={handleCloneClick}
              onRemoveGroup={handleDeleteClick}
            />
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationGroupsTableColumns(): TableColumn<OrganizationGroups_UserGroupFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-groups.header.name",
          defaultMessage: "Name",
        }),
        headerProps: {
          width: "30%",
          minWidth: "240px",
        },
        cellProps: {
          maxWidth: 0,
        },
        CellContent: ({ row }) => {
          return <OverflownText>{row.name}</OverflownText>;
        },
      },
      {
        key: "members",
        header: intl.formatMessage({
          id: "organization-groups.header.members",
          defaultMessage: "Members",
        }),
        align: "left",
        CellContent: ({ row: { members }, column }) => (
          <Flex justifyContent={column.align}>
            <UserAvatarList users={members} max={10} />
          </Flex>
        ),
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "1px",
        },
        CellContent: ({ row }) => (
          <DateTime
            value={row.createdAt}
            format={FORMATS.LLL}
            useRelativeTime
            whiteSpace="nowrap"
          />
        ),
      },
    ],
    [intl.locale]
  );
}

export function useConfirmDeleteGroupsDialog() {
  return useDialog(ConfirmDeleteGroupsDialog);
}

function ConfirmDeleteGroupsDialog({
  groupIds,
  name,
  ...props
}: DialogProps<{
  name: string;
  groupIds?: string[];
}>) {
  const count = groupIds?.length ?? 1;

  return (
    <ConfirmDialog
      hasCloseButton
      header={
        <FormattedMessage
          id="organization-groups.confirm-delete.header"
          defaultMessage="Delete {count, plural, =1 {group} other {groups}}"
          values={{ count }}
        />
      }
      body={
        <FormattedMessage
          id="organization-groups.confirm-delete.body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected groups}}? If you continue, all members will lose access to requests shared with the {count, plural, =1 {group} other {groups}}."
          values={{
            count,
            name,
            b: (chunks: any[]) => <b>{chunks}</b>,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage
            id="generic.confirm-delete-button"
            defaultMessage="Yes, delete"
          />
        </Button>
      }
      {...props}
    />
  );
}

OrganizationGroups.fragments = {
  get UserGroupPagination() {
    return gql`
      fragment OrganizationGroups_UserGroupPagination on UserGroupPagination {
        items {
          ...OrganizationGroups_UserGroup
        }
        totalCount
      }
      ${this.UserGroup}
    `;
  },
  get UserGroup() {
    return gql`
      fragment OrganizationGroups_UserGroup on UserGroup {
        id
        name
        createdAt
        members {
          id
          fullName
          email
        }
      }
    `;
  },
  get User() {
    return gql`
      fragment OrganizationGroups_User on User {
        ...AppLayout_User
      }
      ${AppLayout.fragments.User}
    `;
  },
};

OrganizationGroups.mutations = [
  gql`
    mutation OrganizationGroups_createUserGroup(
      $name: String!
      $userIds: [GID!]!
    ) {
      createUserGroup(name: $name, userIds: $userIds) {
        ...OrganizationGroups_UserGroup
      }
    }
    ${OrganizationGroups.fragments.UserGroup}
  `,
  gql`
    mutation OrganizationGroups_deleteUserGroup($ids: [GID!]!) {
      deleteUserGroup(ids: $ids)
    }
  `,
  gql`
    mutation OrganizationGroups_cloneUserGroup(
      $ids: [GID!]!
      $locale: String!
    ) {
      cloneUserGroup(userGroupIds: $ids, locale: $locale) {
        ...OrganizationGroups_UserGroup
      }
    }
    ${OrganizationGroups.fragments.UserGroup}
  `,
];

OrganizationGroups.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  const { page, items, search, sort } = parseQuery(query, QUERY_STATE);
  await Promise.all([
    fetchQuery<OrganizationGroupsQuery, OrganizationGroupsQueryVariables>(
      gql`
        query OrganizationGroups(
          $offset: Int!
          $limit: Int!
          $search: String
          $sortBy: [QueryUserGroups_OrderBy!]
        ) {
          userGroups(
            offset: $offset
            limit: $limit
            search: $search
            sortBy: $sortBy
          ) {
            ...OrganizationGroups_UserGroupPagination
          }
        }
        ${OrganizationGroups.fragments.UserGroupPagination}
      `,
      {
        variables: {
          offset: items * (page - 1),
          limit: items,
          search,
          sortBy: [
            `${sort.field}_${sort.direction}` as QueryUserGroups_OrderBy,
          ],
        },
      }
    ),
    fetchQuery<OrganizationGroupsUserQuery>(
      gql`
        query OrganizationGroupsUser {
          me {
            ...OrganizationGroups_User
          }
        }
        ${OrganizationGroups.fragments.User}
      `
    ),
  ]);
};

export default compose(
  withAdminOrganizationRole,
  withDialogs,
  withApolloData
)(OrganizationGroups);
