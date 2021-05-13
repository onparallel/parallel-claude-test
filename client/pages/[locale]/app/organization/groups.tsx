import { Flex, Heading, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import { FormattedMessage, useIntl } from "react-intl";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { compose } from "@parallel/utils/compose";
import {
  integer,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useOrganizationSections } from "@parallel/utils/useOrganizationSections";
import { DateTime } from "@parallel/components/common/DateTime";
import { useCallback, useMemo, useState } from "react";
import { FORMATS } from "@parallel/utils/dates";
import gql from "graphql-tag";
import { TablePage } from "@parallel/components/common/TablePage";
import { OrganizationGroupsListTableHeader } from "@parallel/components/organization/OrganizationGroupsListTableHeader";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCreateGroupDialog } from "@parallel/components/organization/CreateGroupDialog";

const SORTING = ["groupName", "members", "createdAt"] as const;

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

  const me = {
    organization: {
      groups: {
        items: [
          {
            id: "1",
            name: "bla bla",
            memebers: [],
          },
        ],
        totalCount: 1,
      },
    },
  };

  const groupList = me.organization.groups;

  const selectedGroups = useMemo(
    () =>
      selected
        .map((groupId) => groupList.items.find((g) => g.id === groupId)!)
        .filter((u) => u !== undefined),
    [selected.join(","), groupList.items]
  );

  const [search, setSearch] = useState(state.search);

  const sections = useOrganizationSections();

  const columns = useOrganizationGroupsTableColumns();

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

  const showCreateGroupDialog = useCreateGroupDialog();
  const handleCreateGroup = async () => {
    try {
      const newGroup = await showCreateGroupDialog({});
      //   await createOrganizationUser({
      //     variables: newUser,
      //     update: () => {
      //       refetch();
      //     },
      //   });
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
      <Flex flexDirection="column" flex="1" minHeight={0} padding={4}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          isSelectable
          isHighlightable
          columns={columns}
          rows={[]}
          rowKeyProp="id"
          loading={false}
          page={state.page}
          pageSize={state.items}
          totalCount={1}
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
              onReload={() => {}}
              onSearchChange={handleSearchChange}
              onCreateGroup={handleCreateGroup}
              onUpdateGroupStatus={() => {}}
            />
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationGroupsTableColumns(): TableColumn<OrganizationGroups_GroupFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        header: intl.formatMessage({
          id: "organization-group.header.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row }) => {
          return (
            <Text
              as="span"
              display="inline-flex"
              whiteSpace="nowrap"
              alignItems="center"
            >
              <Text as="span">{row.name}</Text>
            </Text>
          );
        },
      },
      {
        key: "members",
        header: intl.formatMessage({
          id: "organization-group.header.members",
          defaultMessage: "Members",
        }),
        align: "center",
        cellProps: { width: "1%" },
        CellContent: ({ row: { petition }, column }) => (
          <Flex justifyContent={column.align}>
            <UserAvatarList
              users={petition!.userPermissions.map((p) => p.user)}
            />
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

OrganizationGroups.fragments = {
  get Group() {
    return gql`
      fragment OrganizationGroups_Group on User {
        id
        fullName
        email
        role
        createdAt
        lastActiveAt
        status
        isSsoUser
      }
    `;
  },
};

// OrganizationGroups.mutations = [
//   gql`
//     mutation OrganizationGroups_createOrganizationGroup(
//       $firstName: String!
//       $lastName: String!
//       $email: String!
//       $role: OrganizationRole!
//     ) {
//       createOrganizationGroup(
//         email: $email
//         firstName: $firstName
//         lastName: $lastName
//         role: $role
//       ) {
//         ...OrganizationGroups_Group
//       }
//     }
//     ${OrganizationGroups.fragments.Group}
//   `,
//   gql`
//     mutation OrganizationGroups_updateGroupStatus(
//       $userIds: [GID!]!
//       $newStatus: UserStatus!
//       $transferToUserId: GID
//     ) {
//       updateGroupStatus(
//         userIds: $userIds
//         status: $newStatus
//         transferToUserId: $transferToUserId
//       ) {
//         id
//         status
//       }
//     }
//   `,
// ];

export default compose(
  withAdminOrganizationRole,
  withDialogs,
  withApolloData
)(OrganizationGroups);
