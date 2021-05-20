import { gql } from "@apollo/client";
import {
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Heading,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  ForbiddenIcon,
  MoreVerticalIcon,
} from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { useConfirmRemoveMemberDialog } from "@parallel/components/organization/ConfirmRemoveMemberDialog";
import {
  OrganizationGroupQuery,
  OrganizationGroupQueryVariables,
  OrganizationGroupUserQuery,
  OrganizationUsers_UserFragment,
  useOrganizationGroupQuery,
  useOrganizationGroupUserQuery,
  useOrganizationGroup_addUsersToUserGroupMutation,
  useOrganizationGroup_removeUsersFromGroupMutation,
  useOrganizationGroup_deleteUserGroupMutation,
  useOrganizationGroup_cloneUserGroupMutation,
  useOrganizationGroup_updateUserGroupMutation,
  OrganizationGroup_MemberFragment,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import {
  integer,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useAddMemberGroupDialog } from "@parallel/components/organization/AddMemberGroupDialog";
import { useConfirmDeleteGroupsDialog } from "..";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { OrganizationGroupListTableHeader } from "@parallel/components/organization/OrganizationGroupListTableHeader";
import { UnwrapPromise } from "@parallel/utils/types";
import { useRouter } from "next/router";
import { sortBy } from "remeda";

const SORTING = ["fullName", "email", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  search: string(),
  items: values([10, 25, 50]).orDefault(10),
  sort: sorting(SORTING).orDefault({
    field: "fullName",
    direction: "ASC",
  }),
};

type OrganizationGroupProps = UnwrapPromise<
  ReturnType<typeof OrganizationGroup.getInitialProps>
>;

function OrganizationGroup({ groupId }: OrganizationGroupProps) {
  const intl = useIntl();
  const toast = useToast();
  const router = useRouter();
  const [state, setQueryState] = useQueryState(QUERY_STATE);

  const {
    data: { me },
  } = assertQuery(useOrganizationGroupUserQuery());

  const {
    data: { userGroup },
    loading,
    refetch,
  } = assertQuery(
    useOrganizationGroupQuery({
      variables: {
        id: groupId,
      },
    })
  );

  const userList = useMemo(() => {
    console.log("Query State: ", state);
    const {
      items,
      page,
      search,
      sort: { direction, field },
    } = state;
    let members = userGroup?.members ?? [];
    if (search) {
      members = members.filter((u) => {
        return u.fullName?.includes(search) || u.email.includes(search);
      });
    }
    members = sortBy(members, (u) => u[field]);
    if (direction === "DESC") {
      members = members.reverse();
    }
    return members.slice((page - 1) * items, page * items);
  }, [userGroup, state]);

  const [selected, setSelected] = useState<string[]>([]);

  const selectedUsers = useMemo(
    () =>
      selected
        .map((userId) => userList.find((u) => u.id === userId)!)
        .filter((u) => u !== undefined),
    [selected.join(","), userList]
  );

  const [search, setSearch] = useState(state.search);
  const [name, setName] = useState(userGroup?.name ?? "");

  useEffect(() => {
    setName(userGroup?.name ?? "");
  }, [userGroup]);

  const sections = useOrganizationSections();

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

  const [updateUserGroup] = useOrganizationGroup_updateUserGroupMutation();
  const handleChangeGroupName = async (newName: string) => {
    if (name.trim() !== newName.trim()) {
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

  const [deleteUserGroup] = useOrganizationGroup_deleteUserGroupMutation();
  const confirmDelete = useConfirmDeleteGroupsDialog();
  const handleDeleteGroup = async () => {
    await confirmDelete({ name });
    await deleteUserGroup({ variables: { ids: [groupId] } });
    router.push({
      pathname: `/${router.query.locale}/app/organization/groups`,
    });
  };

  const [_cloneUserGroup] = useOrganizationGroup_cloneUserGroupMutation();

  const handleCloneGroup = async () => {
    const { data } = await _cloneUserGroup({
      variables: { ids: [groupId], locale: intl.locale },
    });
    const cloneUserGroupId = data?.cloneUserGroup[0].id || "";

    router.push({
      pathname: `/${router.query.locale}/app/organization/groups/${cloneUserGroupId}`,
    });
  };

  const [addUsersToUserGroup] =
    useOrganizationGroup_addUsersToUserGroupMutation();
  const showAddMemberDialog = useAddMemberGroupDialog();
  const handleAddMember = async () => {
    try {
      const data = await showAddMemberDialog({
        exclude: userGroup?.members.map((m) => m.id) ?? [],
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
          id: "organization.users-added-success.toast-title",
          defaultMessage: "Users added successfully.",
        }),
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch {}
  };

  const [removeUsersFromGroup] =
    useOrganizationGroup_removeUsersFromGroupMutation();
  const showConfirmRemoveMemberDialog = useConfirmRemoveMemberDialog();

  const handleRemoveMember = async (
    members: OrganizationUsers_UserFragment[]
  ) => {
    try {
      await showConfirmRemoveMemberDialog({ selected: members });
      const userIds = members.map((m) => m.id);
      await removeUsersFromGroup({
        variables: { userGroupId: groupId, userIds },
      });
      refetch();
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
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <EditableHeading
            value={name}
            onSubmit={handleChangeGroupName}
          ></EditableHeading>
          <Menu>
            <Tooltip
              placement="left"
              label={intl.formatMessage({
                id: "generic.more-options",
                defaultMessage: "More options...",
              })}
              whiteSpace="nowrap"
            >
              <MenuButton
                as={IconButton}
                variant="outline"
                icon={<MoreVerticalIcon />}
                marginLeft={4}
                aria-label={intl.formatMessage({
                  id: "generic.more-options",
                  defaultMessage: "More options...",
                })}
              />
            </Tooltip>
            <Portal>
              <MenuList>
                <MenuItem onClick={handleCloneGroup}>
                  <CopyIcon marginRight={2} />
                  <FormattedMessage
                    id="component.group-header.clone-label"
                    defaultMessage="Clone group"
                  />
                </MenuItem>
                <MenuDivider />
                <MenuItem color="red.500" onClick={handleDeleteGroup}>
                  <DeleteIcon marginRight={2} />
                  <FormattedMessage
                    id="component.group-header.delete-label"
                    defaultMessage="Delete group"
                  />
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </Flex>
      }
      showBackButton={true}
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
          rows={userList}
          rowKeyProp="id"
          loading={loading}
          page={state.page}
          pageSize={state.items}
          totalCount={userGroup?.members.length ?? 0}
          sort={state.sort}
          onSelectionChange={setSelected}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort }))}
          header={
            <OrganizationGroupListTableHeader
              me={me}
              search={search}
              selectedUsers={selectedUsers}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationGroupTableColumns(): TableColumn<OrganizationGroup_MemberFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "fullName",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return <Text as="span">{row.fullName}</Text>;
        },
      },
      {
        key: "email",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-users.header.user-email",
          defaultMessage: "Email",
        }),
        CellContent: ({ row }) => <>{row.email}</>,
      },
      {
        key: "createdAt",
        isSortable: true,
        header: intl.formatMessage({
          id: "generic.added-at",
          defaultMessage: "Added at",
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

type EditableHeadingProps = {
  value: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
};

const EditableHeading = ({
  value,
  onChange = () => {},
  onSubmit = () => {},
}: EditableHeadingProps) => {
  const intl = useIntl();
  const [name, setName] = useState(value);
  const [inputWidth, setInputWidth] = useState(0);
  const previewRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(value);
    setInputWidth(previewRef?.current?.offsetWidth ?? 0);
  }, [value]);

  return (
    <Heading
      as="h3"
      size="md"
      borderRadius="md"
      borderWidth="2px"
      borderColor="transparent"
      transition="border 0.26s ease"
      _hover={{
        borderWidth: "2px",
        borderColor: "gray.300",
      }}
    >
      <Tooltip
        label={intl.formatMessage({
          id: "organization.groups.edit-name",
          defaultMessage: "Edit name",
        })}
      >
        <Editable
          value={name}
          onChange={(n) => {
            setName(n);
            onChange(n);
          }}
          onSubmit={onSubmit}
        >
          <EditablePreview
            paddingY={1}
            paddingX={2}
            ref={previewRef}
          ></EditablePreview>
          <EditableInput
            paddingY={1}
            paddingX={2}
            minWidth={255}
            width={inputWidth}
          />
        </Editable>
      </Tooltip>
    </Heading>
  );
};

OrganizationGroup.fragments = {
  get UserGroup() {
    return gql`
      fragment OrganizationGroup_UserGroup on UserGroup {
        id
        name
        createdAt
        members {
          ...OrganizationGroup_Member
        }
      }
      ${this.Member}
    `;
  },
  get Member() {
    return gql`
      fragment OrganizationGroup_Member on User {
        id
        fullName
        email
        createdAt
      }
    `;
  },
  get User() {
    return gql`
      fragment OrganizationGroup_User on User {
        ...AppLayout_User
      }
      ${AppLayout.fragments.User}
    `;
  },
};

OrganizationGroup.mutations = [
  gql`
    mutation OrganizationGroup_updateUserGroup(
      $id: GID!
      $data: UpdateUserGroupInput!
    ) {
      updateUserGroup(id: $id, data: $data) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${OrganizationGroup.fragments.UserGroup}
  `,
  gql`
    mutation OrganizationGroup_addUsersToUserGroup(
      $userGroupId: GID!
      $userIds: [GID!]!
    ) {
      addUsersToUserGroup(userGroupId: $userGroupId, userIds: $userIds) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${OrganizationGroup.fragments.UserGroup}
  `,
  gql`
    mutation OrganizationGroup_removeUsersFromGroup(
      $userGroupId: GID!
      $userIds: [GID!]!
    ) {
      removeUsersFromGroup(userGroupId: $userGroupId, userIds: $userIds) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${OrganizationGroup.fragments.UserGroup}
  `,
  gql`
    mutation OrganizationGroup_deleteUserGroup($ids: [GID!]!) {
      deleteUserGroup(ids: $ids)
    }
  `,
  gql`
    mutation OrganizationGroup_cloneUserGroup($ids: [GID!]!, $locale: String!) {
      cloneUserGroup(userGroupIds: $ids, locale: $locale) {
        ...OrganizationGroup_UserGroup
      }
    }
    ${OrganizationGroup.fragments.UserGroup}
  `,
];

OrganizationGroup.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<OrganizationGroupQuery, OrganizationGroupQueryVariables>(
      gql`
        query OrganizationGroup($id: GID!) {
          userGroup(id: $id) {
            ...OrganizationGroup_UserGroup
          }
        }
        ${OrganizationGroup.fragments.UserGroup}
      `,
      {
        variables: {
          id: query.groupId as string,
        },
      }
    ),
    fetchQuery<OrganizationGroupUserQuery>(
      gql`
        query OrganizationGroupUser {
          me {
            ...OrganizationGroup_User
          }
        }
        ${OrganizationGroup.fragments.User}
      `
    ),
  ]);
  return {
    groupId: query.groupId as string,
  };
};

export default compose(
  withAdminOrganizationRole,
  withDialogs,
  withApolloData
)(OrganizationGroup);
