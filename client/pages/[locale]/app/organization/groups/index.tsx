import { Flex, Heading, Text } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import { FormattedMessage, useIntl } from "react-intl";
import { withAdminOrganizationRole } from "@parallel/components/common/withAdminOrganizationRole";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
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
import { TablePage } from "@parallel/components/common/TablePage";
import { OrganizationGroupsListTableHeader } from "@parallel/components/organization/OrganizationGroupsListTableHeader";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { useCreateGroupDialog } from "@parallel/components/organization/CreateGroupDialog";
import { TableColumn } from "@parallel/components/common/Table";
import { withApolloData } from "@parallel/components/common/withApolloData";
import { OverflownText } from "@parallel/components/common/OverflownText";

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

const loading = false;
const refetch = () => {
  console.log("Refetch function");
};
const me = {
  fullName: "Konstantin Klykov",
  id: "yQQfqcU7",
  isSuperAdmin: true,
  onboardingStatus: {
    CONTACT_LIST: { SKIPPED: true },
    PETITIONS_LIST: { SKIPPED: true },
    PETITION_COMPOSE: { SKIPPED: true },
    PETITION_REVIEW: { SKIPPED: true },
  },
  organization: {
    hasSsoProvider: false,
    id: "yw7RQt2cQ4XDHdrbtL3",
    groups: {
      totalCount: 3,
      items: [
        {
          id: "1",
          name: "Grupo HR",
          users: [
            { fullName: "fake 1 user", id: "1SgRex7YxU", __typename: "User" },
            { fullName: "fake 2 user", id: "2SgRex7YxU", __typename: "User" },
            { fullName: "fake 3 user", id: "3SgRex7YxU", __typename: "User" },
          ],
          createdAt: "2021-05-14T08:02:31.861Z",
        },
        {
          id: "2",
          name: "GROUP IT - Nombre de grupo largo",
          users: [
            { fullName: "fake 1 user", id: "1SgRex7YxU", __typename: "User" },
            { fullName: "fake 2 user", id: "2SgRex7YxU", __typename: "User" },
            { fullName: "fake 3 user", id: "3SgRex7YxU", __typename: "User" },
            { fullName: "fake 4 user", id: "4SgRex7YxU", __typename: "User" },
            { fullName: "fake 5 user", id: "5SgRex7YxU", __typename: "User" },
            { fullName: "fake 6 user", id: "6SgRex7YxU", __typename: "User" },
            { fullName: "fake 7 user", id: "7SgRex7YxU", __typename: "User" },
          ],
          createdAt: "2021-05-14T08:02:31.861Z",
        },
        {
          id: "3",
          name: "GROUP 02 - Nombre de grupo muy muy muy largo",
          users: [
            { fullName: "fake 1 user", id: "1SgRex7YxU", __typename: "User" },
            { fullName: "fake 2 user", id: "2SgRex7YxU", __typename: "User" },
            { fullName: "fake 3 user", id: "3SgRex7YxU", __typename: "User" },
            { fullName: "fake 4 user", id: "4SgRex7YxU", __typename: "User" },
            { fullName: "fake 5 user", id: "5SgRex7YxU", __typename: "User" },
            { fullName: "fake 6 user", id: "6SgRex7YxU", __typename: "User" },
            { fullName: "fake 7 user", id: "7SgRex7YxU", __typename: "User" },
            { fullName: "fake 8 user", id: "8SgRex7YxU", __typename: "User" },
            { fullName: "fake 9 user", id: "9SgRex7YxU", __typename: "User" },
            { fullName: "fake 3 user", id: "3SgRex7YxU21", __typename: "User" },
            { fullName: "fake 4 user", id: "4SgRex7YxU22", __typename: "User" },
            { fullName: "fake 5 user", id: "5SgRex7YxU23", __typename: "User" },
            { fullName: "fake 6 user", id: "6SgRex7YxU24", __typename: "User" },
            { fullName: "fake 7 user", id: "7SgRex7YxU25", __typename: "User" },
            { fullName: "fake 8 user", id: "8SgRex7YxU26", __typename: "User" },
            { fullName: "fake 9 user", id: "9SgRex7YxU27", __typename: "User" },
          ],
          createdAt: "2021-05-14T08:02:31.861Z",
        },
      ],
    },
  },
} as any;

function OrganizationGroups() {
  const intl = useIntl();
  const toast = useToast();
  const [state, setQueryState] = useQueryState(QUERY_STATE);
  const [selected, setSelected] = useState<string[]>([]);

  console.log("GROUPS RERENDER");

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
          rows={groupList.items}
          rowKeyProp="id"
          loading={loading}
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
              onReload={() => refetch()}
              onSearchChange={handleSearchChange}
              onCreateGroup={handleCreateGroup}
              onCloneGroup={() => {}}
              onRemoveGroup={() => {}}
            />
          }
        />
      </Flex>
    </SettingsLayout>
  );
}

function useOrganizationGroupsTableColumns(): TableColumn<any>[] {
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
          id: "organization-group.header.members",
          defaultMessage: "Members",
        }),
        align: "left",
        CellContent: ({ row: { users }, column }) => (
          <Flex justifyContent={column.align}>
            <UserAvatarList users={users} max={10} />
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

// OrganizationGroups.getInitialProps = async ({
//   fetchQuery,
//   ...context
// }: WithApolloDataContext) => {
//   const { page, items, search, sort } = parseQuery(context.query, QUERY_STATE);
// };

export default compose(
  withAdminOrganizationRole,
  withDialogs,
  withApolloData
)(OrganizationGroups);
