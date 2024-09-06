import { gql, useMutation } from "@apollo/client";
import { Badge, Center, Flex, Text, useToast } from "@chakra-ui/react";
import { UserXIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withPermission } from "@parallel/components/common/withPermission";
import { UserGroupLayout } from "@parallel/components/layout/UserGroupLayout";
import { OrganizationGroupListTableHeader } from "@parallel/components/organization/OrganizationGroupListTableHeader";
import { useAddMemberGroupDialog } from "@parallel/components/organization/dialogs/AddMemberGroupDialog";
import { useConfirmRemoveMemberDialog } from "@parallel/components/organization/dialogs/ConfirmRemoveMemberDialog";
import {
  OrganizationGroup_UserGroupMemberFragment,
  OrganizationGroup_addUsersToUserGroupDocument,
  OrganizationGroup_removeUsersFromGroupDocument,
  OrganizationGroup_userDocument,
  OrganizationGroup_userGroupDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { sort, sortBy } from "remeda";

const SORTING = ["fullName", "email", "addedAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "fullName",
    direction: "ASC",
  }),
};

type OrganizationGroupProps = UnwrapPromise<ReturnType<typeof OrganizationGroup.getInitialProps>>;

function OrganizationGroup({ groupId }: OrganizationGroupProps) {
  const intl = useIntl();
  const toast = useToast();

  const [state, setQueryState] = useQueryState(QUERY_STATE);

  const {
    data: { me, realMe },
  } = useAssertQuery(OrganizationGroup_userDocument);

  const {
    data: { userGroup },
    loading,
    refetch,
  } = useAssertQuery(OrganizationGroup_userGroupDocument, {
    variables: {
      id: groupId,
    },
  });

  const canEditGroupMembers =
    useHasPermission("TEAMS:CRUD_TEAMS") && ["NORMAL", "INITIAL"].includes(userGroup!.type);

  const [userList, searchedList] = useMemo(() => {
    const {
      items,
      page,
      search,
      sort: { direction, field },
    } = state;

    let members = userGroup?.members ?? [];
    if (search) {
      members = members.filter(({ user }) => {
        return user.fullName?.includes(search) || user.email.includes(search);
      });
    }

    members =
      field === "addedAt"
        ? sortBy(members, (u) => u[field])
        : sort(members, (a, b) => (a.user[field] ?? "").localeCompare(b.user[field] ?? ""));

    if (direction === "DESC") {
      members = members.reverse();
    }

    return [members.slice((page - 1) * items, page * items), members];
  }, [userGroup, state]);

  const { selectedRows, onChangeSelectedIds } = useSelection(userList, "id");

  const [search, setSearch] = useState(state.search);

  const columns = useOrganizationGroupTableColumns();

  const debouncedOnSearchChange = useDebouncedCallback(
    (value) => {
      setQueryState((current) => ({
        ...current,
        search: value,
        page: 1,
      }));
    },
    300,
    [setQueryState],
  );

  const handleSearchChange = useCallback(
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  const [addUsersToUserGroup] = useMutation(OrganizationGroup_addUsersToUserGroupDocument);
  const showAddMemberDialog = useAddMemberGroupDialog();
  const handleAddMember = async () => {
    try {
      const data = await showAddMemberDialog({
        exclude: userGroup?.members.map((m) => m.user.id) ?? [],
      });
      const userIds = data.users.map((m) => m.id);
      await addUsersToUserGroup({
        variables: {
          userGroupId: groupId,
          userIds,
        },
      });
      toast({
        title: intl.formatMessage({
          id: "page.group.users-added-title",
          defaultMessage: "Users added successfully.",
        }),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

  const [removeUsersFromGroup] = useMutation(OrganizationGroup_removeUsersFromGroupDocument);
  const showConfirmRemoveMemberDialog = useConfirmRemoveMemberDialog();

  const handleRemoveMember = async () => {
    try {
      await showConfirmRemoveMemberDialog({
        selected: selectedRows,
      });
      const userIds = selectedRows.map((m) => m.user.id);
      await removeUsersFromGroup({
        variables: { userGroupId: groupId, userIds },
      });
      refetch();
    } catch {}
  };

  return (
    <UserGroupLayout
      groupId={groupId}
      currentTabKey="users"
      me={me}
      realMe={realMe}
      userGroup={userGroup}
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={24}>
        <TablePage
          flex="0 1 auto"
          isSelectable={canEditGroupMembers}
          isHighlightable
          columns={columns}
          rows={userList}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={searchedList?.length ?? 0}
          sort={state.sort}
          onSelectionChange={onChangeSelectedIds}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
          actions={[
            {
              key: "remove",
              onClick: handleRemoveMember,
              colorScheme: "red",
              leftIcon: <UserXIcon />,
              children: (
                <FormattedMessage
                  id="organization-groups.remove-from-group"
                  defaultMessage="Remove from team"
                />
              ),
            },
          ]}
          header={
            <OrganizationGroupListTableHeader
              search={search}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onAddMember={handleAddMember}
              canAddMember={canEditGroupMembers}
            />
          }
          body={
            userList.length === 0 && !loading ? (
              state.search ? (
                <Center flex="1">
                  <Text color="gray.400" fontSize="lg">
                    <FormattedMessage
                      id="page.group.no-results"
                      defaultMessage="There's no users matching your search"
                    />
                  </Text>
                </Center>
              ) : (
                <Center flex="1">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="page.group.no-users"
                      defaultMessage="No users added to this team yet"
                    />
                  </Text>
                </Center>
              )
            ) : null
          }
        />
      </Flex>
    </UserGroupLayout>
  );
}

function useOrganizationGroupTableColumns(): TableColumn<OrganizationGroup_UserGroupMemberFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "fullName",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <Text as="span" display="inline-flex" whiteSpace="nowrap" alignItems="center">
              <Text as="span">{row.user.fullName}</Text>
              {row.user.isOrgOwner ? (
                <Badge marginStart={2} colorScheme="primary" position="relative" top="1.5px">
                  <FormattedMessage id="generic.organization-owner" defaultMessage="Owner" />
                </Badge>
              ) : null}
            </Text>
          );
        },
      },
      {
        key: "email",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.email",
          defaultMessage: "Email",
        }),
        cellProps: {
          minWidth: "240px",
        },
        CellContent: ({ row }) => <>{row.user.email}</>,
      },
      {
        key: "lastActiveAt",
        label: intl.formatMessage({
          id: "generic.last-active-at",
          defaultMessage: "Last active at",
        }),
        cellProps: {
          minWidth: "220px",
        },
        CellContent: ({ row }) =>
          row.user.lastActiveAt ? (
            <DateTime
              value={row.user.lastActiveAt}
              format={FORMATS.LLL}
              useRelativeTime
              whiteSpace="nowrap"
            />
          ) : (
            <Text textStyle="hint">
              <FormattedMessage id="generic.never-active" defaultMessage="Never active" />
            </Text>
          ),
      },
      {
        key: "addedAt",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.added-at",
          defaultMessage: "Added at",
        }),
        cellProps: {
          minWidth: "220px",
        },
        CellContent: ({ row }) => (
          <DateTime value={row.addedAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
        ),
      },
    ],
    [intl.locale],
  );
}

const _fragments = {
  get UserGroup() {
    return gql`
      fragment OrganizationGroup_UserGroup on UserGroup {
        id
        name
        createdAt
        members {
          ...OrganizationGroup_UserGroupMember
        }
        type
        ...UserGroupLayout_UserGroup
      }
      ${this.UserGroupMember}
      ${UserGroupLayout.fragments.UserGroup}
    `;
  },
  get UserGroupMember() {
    return gql`
      fragment OrganizationGroup_UserGroupMember on UserGroupMember {
        id
        addedAt
        user {
          id
          fullName
          email
          isOrgOwner
          lastActiveAt
        }
      }
    `;
  },
};

const _mutations = [
  gql`
    mutation OrganizationGroup_addUsersToUserGroup($userGroupId: GID!, $userIds: [GID!]!) {
      addUsersToUserGroup(userGroupId: $userGroupId, userIds: $userIds) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${_fragments.UserGroup}
  `,
  gql`
    mutation OrganizationGroup_removeUsersFromGroup($userGroupId: GID!, $userIds: [GID!]!) {
      removeUsersFromGroup(userGroupId: $userGroupId, userIds: $userIds) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${_fragments.UserGroup}
  `,
];

const _queries = [
  gql`
    query OrganizationGroup_userGroup($id: GID!) {
      userGroup(id: $id) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${_fragments.UserGroup}
  `,
  gql`
    query OrganizationGroup_user {
      ...UserGroupLayout_Query
    }
    ${UserGroupLayout.fragments.Query}
  `,
];

OrganizationGroup.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const groupId = query.groupId as string;
  await Promise.all([
    fetchQuery(OrganizationGroup_userGroupDocument, { variables: { id: groupId } }),
    fetchQuery(OrganizationGroup_userDocument),
  ]);
  return { groupId };
};

export default compose(
  withDialogs,
  withPermission("TEAMS:LIST_TEAMS", { orPath: "/app/organization" }),
  withApolloData,
)(OrganizationGroup);
