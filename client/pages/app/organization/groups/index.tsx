import { gql } from "@apollo/client";
import { Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { DateTime } from "@parallel/components/common/DateTime";
import { DialogProps, useDialog, withDialogs } from "@parallel/components/common/DialogProvider";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useCreateGroupDialog } from "@parallel/components/organization/CreateGroupDialog";
import { OrganizationGroupsListTableHeader } from "@parallel/components/organization/OrganizationGroupsListTableHeader";
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
import { assertQuery, useAssertQueryOrPreviousData } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { withError } from "@parallel/utils/promises/withError";
import {
  integer,
  parseQuery,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
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
        sortBy: [`${state.sort.field}_${state.sort.direction}` as QueryUserGroups_OrderBy],
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
      toast({
        title: intl.formatMessage(
          {
            id: "view.groups.clone-success-title",
            defaultMessage: "{count, plural, =1{Group} other{Groups}} cloned successfully.",
          },
          { count: selected.length }
        ),
        description: intl.formatMessage(
          {
            id: "view.groups.clone-success-description",
            defaultMessage:
              "{count, plural, =1 {Group <b>{name}</b>} other{<b>#</b> groups}} successfully cloned.",
          },
          {
            count: selected.length,
            name: selectedGroups[0].name,
          }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    },
    [userGroups, selected]
  );

  const [deleteUserGroup] = useOrganizationGroups_deleteUserGroupMutation();
  const handleDeleteClick = useCallback(async () => {
    const [error] = await withError(
      confirmDelete({ name: selectedGroups[0].name, groupIds: selected })
    );
    if (!error) {
      await deleteUserGroup({
        variables: {
          ids: selected,
        },
      });
      refetch();
      toast({
        title: intl.formatMessage(
          {
            id: "view.groups.delete-success-title",
            defaultMessage: "{count, plural, =1{Group} other{Groups}} deleted successfully.",
          },
          { count: selected.length }
        ),
        description: intl.formatMessage(
          {
            id: "view.groups.delete-success-description",
            defaultMessage:
              "{count, plural, =1 {Group <b>{name}</b>} other{<b>#</b> groups}} successfully deleted.",
          },
          {
            count: selected.length,
            name: selectedGroups[0].name,
          }
        ),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
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
          id: "view.groups.create-success-title",
          defaultMessage: "Group created successfully.",
        }),
        description: intl.formatMessage(
          {
            id: "view.groups.create-success-description",
            defaultMessage: "Group {name} successfully created.",
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
        defaultMessage: "User groups",
      })}
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="view.organization.title" defaultMessage="Organization" />
      }
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="view.groups.title" defaultMessage="User groups" />
        </Heading>
      }
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4}>
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
          onPageSizeChange={(items) => setQueryState((s) => ({ ...s, items, page: 1 }))}
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
          body={
            userGroups.totalCount === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="view.groups.no-results"
                      defaultMessage="There's no groups matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="view.groups.no-groups"
                      defaultMessage="You have no groups yet"
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
          id: "generic.members",
          defaultMessage: "Members",
        }),
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
                id: "view.groups.no-members-added",
                defaultMessage: "No members added",
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
          id="view.groups.confirm-delete-header"
          defaultMessage="Delete {count, plural, =1 {group} other {groups}}"
          values={{ count }}
        />
      }
      body={
        <FormattedMessage
          id="view.groups.confirm-delete-body"
          defaultMessage="Are you sure you want to delete {count, plural, =1 {<b>{name}</b>} other {the <b>#</b> selected groups}}? If you continue, all members will lose access to petitions shared with the {count, plural, =1 {group} other {groups}}."
          values={{
            count,
            name,
          }}
        />
      }
      confirm={
        <Button colorScheme="red" onClick={() => props.onResolve()}>
          <FormattedMessage id="view.groups.confirm-delete-button" defaultMessage="Yes, delete" />
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
  get User() {
    return gql`
      fragment OrganizationGroups_User on User {
        ...SettingsLayout_User
      }
      ${SettingsLayout.fragments.User}
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

OrganizationGroups.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
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
          userGroups(offset: $offset, limit: $limit, search: $search, sortBy: $sortBy) {
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
          sortBy: [`${sort.field}_${sort.direction}` as QueryUserGroups_OrderBy],
        },
      }
    ),
    fetchQuery<OrganizationGroupsUserQuery>(
      gql`
        query OrganizationGroupsUser {
          me {
            ...OrganizationGroups_User
            ...OrganizationGroupsListTableHeader_User
          }
        }
        ${OrganizationGroups.fragments.User}
        ${OrganizationGroupsListTableHeader.fragments.User}
      `
    ),
  ]);
};

export default compose(withDialogs, withApolloData)(OrganizationGroups);
