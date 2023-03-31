import { gql, useMutation } from "@apollo/client";
import { Flex, MenuDivider, MenuItem, MenuList, Text, useToast } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon, UserXIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { EditableHeading } from "@parallel/components/common/EditableHeading";
import { MoreOptionsMenuButton } from "@parallel/components/common/MoreOptionsMenuButton";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { WhenOrgRole } from "@parallel/components/common/WhenOrgRole";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { OrganizationSettingsLayout } from "@parallel/components/layout/OrganizationSettingsLayout";
import { useAddMemberGroupDialog } from "@parallel/components/organization/dialogs/AddMemberGroupDialog";
import { useConfirmRemoveMemberDialog } from "@parallel/components/organization/dialogs/ConfirmRemoveMemberDialog";
import { OrganizationGroupListTableHeader } from "@parallel/components/organization/OrganizationGroupListTableHeader";
import {
  OrganizationGroup_addUsersToUserGroupDocument,
  OrganizationGroup_cloneUserGroupsDocument,
  OrganizationGroup_deleteUserGroupDocument,
  OrganizationGroup_removeUsersFromGroupDocument,
  OrganizationGroup_updateUserGroupDocument,
  OrganizationGroup_userDocument,
  OrganizationGroup_userGroupDocument,
  OrganizationGroup_UserGroupMemberFragment,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { asSupportedUserLocale } from "@parallel/utils/locales";
import { withError } from "@parallel/utils/promises/withError";
import { integer, sorting, string, useQueryState, values } from "@parallel/utils/queryState";
import { isAdmin } from "@parallel/utils/roles";
import { UnwrapPromise } from "@parallel/utils/types";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useSelection } from "@parallel/utils/useSelectionState";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { sort, sortBy } from "remeda";
import { useConfirmDeleteGroupsDialog } from "..";

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
  const router = useRouter();
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

  const canEdit = isAdmin(me.role);

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
  const [name, setName] = useState(userGroup?.name ?? "");

  useEffect(() => {
    setName(userGroup?.name ?? "");
  }, [userGroup]);

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
    [setQueryState]
  );

  const handleSearchChange = useCallback(
    (value: string | null) => {
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange]
  );

  const [updateUserGroup] = useMutation(OrganizationGroup_updateUserGroupDocument);
  const handleChangeGroupName = async (newName: string) => {
    if (newName.trim() && name.trim() !== newName.trim()) {
      await updateUserGroup({
        variables: {
          id: groupId,
          data: {
            name: newName,
          },
        },
      });
    }
  };

  const [deleteUserGroup] = useMutation(OrganizationGroup_deleteUserGroupDocument);
  const confirmDelete = useConfirmDeleteGroupsDialog();
  const handleDeleteGroup = async () => {
    const [error] = await withError(confirmDelete({ name }));
    if (!error) {
      await deleteUserGroup({ variables: { ids: [groupId] } });
      router.push("/app/organization/groups");
    }
  };

  const [cloneUserGroups] = useMutation(OrganizationGroup_cloneUserGroupsDocument);

  const handleCloneGroup = async () => {
    const { data } = await cloneUserGroups({
      variables: { ids: [groupId], locale: asSupportedUserLocale(intl.locale) },
    });
    const cloneUserGroupId = data?.cloneUserGroups[0].id || "";

    router.push(`/app/organization/groups/${cloneUserGroupId}`);
  };

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
          id: "view.group.users-added-title",
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
    <OrganizationSettingsLayout
      title={name}
      basePath="/app/organization/groups"
      me={me}
      realMe={realMe}
      header={
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <EditableHeading isDisabled={!canEdit} value={name} onChange={handleChangeGroupName} />
          <WhenOrgRole role="ADMIN">
            <MoreOptionsMenuButton
              variant="outline"
              options={
                <MenuList>
                  <MenuItem
                    onClick={handleCloneGroup}
                    icon={<CopyIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.group-header.clone-label"
                      defaultMessage="Clone team"
                    />
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem
                    color="red.500"
                    onClick={handleDeleteGroup}
                    icon={<DeleteIcon display="block" boxSize={4} />}
                  >
                    <FormattedMessage
                      id="component.group-header.delete-label"
                      defaultMessage="Delete team"
                    />
                  </MenuItem>
                </MenuList>
              }
            />
          </WhenOrgRole>
        </Flex>
      }
      showBackButton={true}
    >
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable={canEdit}
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
            />
          }
          body={
            userList.length === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-results"
                      defaultMessage="There's no users matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-users"
                      defaultMessage="No users added to this team yet"
                    />
                  </Text>
                </Flex>
              )
            ) : null
          }
        />
      </Flex>
    </OrganizationSettingsLayout>
  );
}

function useOrganizationGroupTableColumns(): TableColumn<OrganizationGroup_UserGroupMemberFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "fullName",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "43%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return <Text as="span">{row.user.fullName}</Text>;
        },
      },
      {
        key: "email",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.email",
          defaultMessage: "Email",
        }),
        cellProps: {
          width: "42%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => <>{row.user.email}</>,
      },
      {
        key: "addedAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.added-at",
          defaultMessage: "Added at",
        }),
        cellProps: {
          width: "15%",
          minWidth: "140px",
        },
        CellContent: ({ row }) => (
          <DateTime value={row.addedAt} format={FORMATS.LLL} useRelativeTime whiteSpace="nowrap" />
        ),
      },
    ],
    [intl.locale]
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
      }
      ${this.UserGroupMember}
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
        }
      }
    `;
  },
};

const _mutations = [
  gql`
    mutation OrganizationGroup_updateUserGroup($id: GID!, $data: UpdateUserGroupInput!) {
      updateUserGroup(id: $id, data: $data) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${_fragments.UserGroup}
  `,
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
  gql`
    mutation OrganizationGroup_deleteUserGroup($ids: [GID!]!) {
      deleteUserGroup(ids: $ids)
    }
  `,
  gql`
    mutation OrganizationGroup_cloneUserGroups($ids: [GID!]!, $locale: UserLocale!) {
      cloneUserGroups(userGroupIds: $ids, locale: $locale) {
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
      ...OrganizationSettingsLayout_Query
    }
    ${OrganizationSettingsLayout.fragments.Query}
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

export default compose(withDialogs, withApolloData)(OrganizationGroup);
