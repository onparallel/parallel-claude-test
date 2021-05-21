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
  useEditableControls,
  useToast,
} from "@chakra-ui/react";
import {
  CopyIcon,
  DeleteIcon,
  EditSimpleIcon,
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
  useOrganizationGroupQuery,
  useOrganizationGroupUserQuery,
  useOrganizationGroup_addUsersToUserGroupMutation,
  useOrganizationGroup_removeUsersFromGroupMutation,
  useOrganizationGroup_deleteUserGroupMutation,
  useOrganizationGroup_cloneUserGroupMutation,
  useOrganizationGroup_updateUserGroupMutation,
  OrganizationGroup_UserGroupMemberFragment,
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
import { OrganizationGroupListTableHeader } from "@parallel/components/organization/OrganizationGroupListTableHeader";
import { UnwrapPromise } from "@parallel/utils/types";
import { useRouter } from "next/router";
import { sortBy } from "remeda";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { If } from "@parallel/utils/conditions";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";

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
        : sortBy(members, ({ user }) => user[field]);

    if (direction === "DESC") {
      members = members.reverse();
    }
    return members.slice((page - 1) * items, page * items);
  }, [userGroup, state]);

  const [selected, setSelected] = useState<string[]>([]);

  const selectedMembers = useMemo(
    () =>
      selected
        .map((memberId) => userList.find((m) => m.id === memberId)!)
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

  const [removeUsersFromGroup] =
    useOrganizationGroup_removeUsersFromGroupMutation();
  const showConfirmRemoveMemberDialog = useConfirmRemoveMemberDialog();

  const handleRemoveMember = async (
    members: OrganizationGroup_UserGroupMemberFragment[]
  ) => {
    try {
      await showConfirmRemoveMemberDialog({
        selected: members,
      });
      const userIds = members.map(({ user }) => user.id);
      await removeUsersFromGroup({
        variables: { userGroupId: groupId, userIds },
      });
      refetch();
    } catch {}
  };

  return (
    <SettingsLayout
      title={name}
      basePath="/app/organization"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage
          id="view.organization.title"
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
              search={search}
              selectedMembers={selectedMembers}
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />
          }
          body={
            userList.length === 0 && !loading ? (
              state.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-results"
                      defaultMessage="There's no members matching your search"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="view.group.no-members"
                      defaultMessage="No members added to this group yet"
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
          width: "1px",
        },
        CellContent: ({ row }) => (
          <DateTime
            value={row.addedAt}
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

const EditableControls = ({ ...props }) => {
  const { isEditing, getEditButtonProps } = useEditableControls();

  return (
    <If condition={!isEditing}>
      <IconButtonWithTooltip
        label={props.label}
        size="sm"
        icon={<EditSimpleIcon />}
        {...getEditButtonProps()}
        {...props}
      />
    </If>
  );
};

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
    <Heading as="h3" size="md">
      <Editable
        value={name}
        onChange={(n) => {
          setName(n);
          onChange(n);
        }}
        onSubmit={onSubmit}
        display="flex"
        alignItems="center"
        submitOnBlur
      >
        <EditablePreview
          paddingY={1}
          paddingX={2}
          ref={previewRef}
          borderRadius="md"
          borderWidth="2px"
          borderColor="transparent"
          transition="border 0.26s ease"
          _hover={{
            borderWidth: "2px",
            borderColor: "gray.300",
          }}
          whiteSpace="nowrap"
          overflow="hidden"
          maxWidth={655}
          textOverflow="ellipsis"
        ></EditablePreview>

        <EditableInput
          paddingY={1}
          paddingX={2}
          minWidth={255}
          width={inputWidth}
        />
        <EditableControls
          marginLeft={1}
          background={"white"}
          color={"gray.400"}
          fontSize={18}
          _hover={{ backgroundColor: "white", color: "gray.600" }}
          label={intl.formatMessage({
            id: "view.group.edit-name",
            defaultMessage: "Edit name",
          })}
        />
      </Editable>
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
