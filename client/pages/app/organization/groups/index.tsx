import { gql, useMutation } from "@apollo/client";
import { Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  DialogProps,
  useDialog,
  withDialogs,
} from "@parallel/components/common/dialogs/DialogProvider";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useCreateGroupDialog } from "@parallel/components/organization/dialogs/CreateGroupDialog";
import { OrganizationGroupsListTableHeader } from "@parallel/components/organization/OrganizationGroupsListTableHeader";
import {
  OrganizationGroups_cloneUserGroupDocument,
  OrganizationGroups_createUserGroupDocument,
  OrganizationGroups_deleteUserGroupDocument,
  OrganizationGroups_userDocument,
  OrganizationGroups_UserGroupFragment,
  OrganizationGroups_userGroupsDocument,
  QueryUserGroups_OrderBy,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { withError } from "@parallel/utils/promises/withError";
import { integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { isAdmin } from "@parallel/utils/roles";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

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

  const [state, setQueryState] = useQueryState(QUERY_STATE);

  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationGroups_userDocument);

  const { data, loading, refetch } = useQueryOrPreviousData(OrganizationGroups_userGroupsDocument, {
    variables: {
      offset: state.items * (state.page - 1),
      limit: state.items,
      search: state.search,
      sortBy: [`${state.sort.field}_${state.sort.direction}` as QueryUserGroups_OrderBy],
    },
    fetchPolicy: "cache-and-network",
  });

  const userGroups = data?.userGroups;

  const { selectedIds, selectedRows, onChangeSelectedIds } = useSelection(userGroups?.items, "id");

  const canEdit = isAdmin(me.role);

  const [search, setSearch] = useState(state.search);

  const sections = useOrganizationSections(me);

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

  const navigate = useHandleNavigation();
  const handleRowClick = useCallback(function (
    row: OrganizationGroups_UserGroupFragment,
    event: MouseEvent
  ) {
    navigate(`/app/organization/groups/${row.id}`, event);
  },
  []);

  const [cloneUserGroup] = useMutation(OrganizationGroups_cloneUserGroupDocument);
  const handleCloneClick = useCallback(
    async function () {
      await cloneUserGroup({
        variables: {
          ids: selectedIds,
          locale: intl.locale,
        },
      });
      refetch();
      toast({
        title: intl.formatMessage(
          {
            id: "view.groups.clone-success-title",
            defaultMessage: "{count, plural, =1{Team} other{Teams}} cloned successfully.",
          },
          { count: selectedIds.length }
        ),
        description: intl.formatMessage(
          {
            id: "view.groups.clone-success-description",
            defaultMessage:
              "{count, plural, =1 {Team <b>{name}</b>} other{<b>#</b> teams}} successfully cloned.",
          },
          {
            count: selectedIds.length,
            name: selectedRows[0].name,
          }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    },
    [userGroups, selectedIds]
  );

  const [deleteUserGroup] = useMutation(OrganizationGroups_deleteUserGroupDocument);
  const handleDeleteClick = useCallback(async () => {
    const [error] = await withError(
      confirmDelete({ name: selectedRows[0].name, groupIds: selectedIds })
    );
    if (!error) {
      await deleteUserGroup({
        variables: {
          ids: selectedIds,
        },
      });
      refetch();
      toast({
        title: intl.formatMessage(
          {
            id: "view.groups.delete-success-title",
            defaultMessage: "{count, plural, =1{Team} other{Teams}} deleted successfully.",
          },
          { count: selectedIds.length }
        ),
        description: intl.formatMessage(
          {
            id: "view.groups.delete-success-description",
            defaultMessage:
              "{count, plural, =1 {Team <b>{name}</b>} other{<b>#</b> teams}} successfully deleted.",
          },
          {
            count: selectedIds.length,
            name: selectedRows[0].name,
          }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [userGroups, selectedIds]);

  const [createUserGroup] = useMutation(OrganizationGroups_createUserGroupDocument);
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
          id: "view.groups.create-success-title",
          defaultMessage: "Team created successfully.",
        }),
        description: intl.formatMessage(
          {
            id: "view.groups.create-success-description",
            defaultMessage: "Team {name} successfully created.",
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
        id: "view.groups.title",
        defaultMessage: "Teams",
      })}
      basePath="/app/organization"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="view.groups.title" defaultMessage="Teams" />
        </Heading>
      }
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable={canEdit}
          isHighlightable
          columns={columns}
          rows={userGroups?.items}
          onRowClick={handleRowClick}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={userGroups?.totalCount}
          sort={state.sort}
          onSelectionChange={onChangeSelectedIds}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          actions={[
            {
              key: "clone",
              onClick: handleCloneClick,
              leftIcon: <CopyIcon />,
              children: (
                <FormattedMessage
                  id="organization-groups.clone-group"
                  defaultMessage="Clone {count, plural, =1{team} other {teams}}"
                  values={{ count: selectedRows.length }}
                />
              ),
            },
            {
              key: "remove",
              onClick: handleDeleteClick,
              colorScheme: "red",
              leftIcon: <DeleteIcon />,
              children: (
                <FormattedMessage
                  id="organization-groups.delete-group"
                  defaultMessage="Delete {count, plural, =1{team} other {teams}}"
                  values={{ count: selectedRows.length }}
                />
              ),
            },
          ]}
          header={
            <OrganizationGroupsListTableHeader
              search={search}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onCreateGroup={handleCreateGroup}
            />
          }
          body={
            userGroups && userGroups.totalCount === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="view.groups.no-results"
                      defaultMessage="There's no teams matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="view.groups.no-groups"
                      defaultMessage="You have no teams yet"
                    />
                  </Text>
                </Flex>
              )
            ) : null
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
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "30%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return <OverflownText>{row.name}</OverflownText>;
        },
      },
      {
        key: "members",
        header: intl.formatMessage({
          id: "generic.users",
          defaultMessage: "Users",
        }),
        cellProps: {
          width: "55%",
          minWidth: "240px",
        },
        align: "left",
        CellContent: ({ row: { members }, column }) => {
          const users = members.map((m) => m.user);

          return users.length ? (
            <Flex justifyContent={column.align}>
              <UserAvatarList usersOrGroups={users} max={10} />
            </Flex>
          ) : (
            <OverflownText textStyle={"hint"}>
              {intl.formatMessage({
                id: "view.groups.no-users-added",
                defaultMessage: "No users added",
              })}
            </OverflownText>
          );
        },
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "15%",
          minWidth: "200px",
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
          id="view.groups.confirm-delete-header"
          defaultMessage="Delete {count, plural, =1 {team} other {teams}}"
          values={{ count }}
        />
      }
      body={
        <FormattedMessage
          id="view.groups.confirm-delete-body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected teams}}? If you continue, all members will lose access to parallels shared with the {count, plural, =1 {team} other {teams}}."
          values={{
            count,
            name,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="generic.confirm-delete-button" defaultMessage="Yes, delete" />
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
          user {
            ...UserAvatarList_User
          }
        }
      }
      ${UserAvatarList.fragments.User}
    `;
  },
};

OrganizationGroups.mutations = [
  gql`
    mutation OrganizationGroups_createUserGroup($name: String!, $userIds: [GID!]!) {
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
    mutation OrganizationGroups_cloneUserGroup($ids: [GID!]!, $locale: String!) {
      cloneUserGroup(userGroupIds: $ids, locale: $locale) {
        ...OrganizationGroups_UserGroup
      }
    }
    ${OrganizationGroups.fragments.UserGroup}
  `,
];

OrganizationGroups.queries = [
  gql`
    query OrganizationGroups_userGroups(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [QueryUserGroups_OrderBy!]
    ) {
      userGroups(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
        ...OrganizationGroups_UserGroupPagination
      }
    }
    ${OrganizationGroups.fragments.UserGroupPagination}
  `,
  gql`
    query OrganizationGroups_user {
      ...SettingsLayout_Query
    }
    ${SettingsLayout.fragments.Query}
  `,
];

OrganizationGroups.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationGroups_userDocument);
};

export default compose(withDialogs, withApolloData)(OrganizationGroups);
