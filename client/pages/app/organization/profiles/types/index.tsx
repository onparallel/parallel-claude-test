import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Center, Flex } from "@chakra-ui/react";
import { ArchiveIcon, CopyIcon, DeleteIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { SimpleMenuSelect } from "@parallel/components/common/SimpleMenuSelect";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { WithApolloDataContext, withApolloData } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { withPermission } from "@parallel/components/common/withPermission";
import { OrganizationProfilesLayout } from "@parallel/components/organization/profiles/OrganizationProfilesLayout";
import { ProfileTypesListHeader } from "@parallel/components/organization/profiles/ProfileTypesListHeader";
import {
  useCreateProfileTypeDialog,
  useUpdateProfileTypeDialog,
} from "@parallel/components/organization/profiles/dialogs/CreateOrUpdateProfileTypeDialog";
import {
  OrganizationProfileTypes_ProfileTypeFragment,
  OrganizationProfileTypes_cloneProfileTypeDocument,
  OrganizationProfileTypes_createProfileTypeDocument,
  OrganizationProfileTypes_profileTypesDocument,
  OrganizationProfileTypes_userDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useArchiveProfileType } from "@parallel/utils/mutations/useArchiveProfileType";
import { useDeleteProfileType } from "@parallel/utils/mutations/useDeleteProfileType";
import { useUnarchiveProfileType } from "@parallel/utils/mutations/useUnarchiveProfileType";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  QueryStateFrom,
  boolean,
  integer,
  sorting,
  string,
  useQueryState,
  useQueryStateSlice,
  values,
} from "@parallel/utils/queryState";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, PropsWithChildren, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Text } from "@parallel/components/ui";

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
  showArchived: boolean().orDefault(false),
};

export type ProfileTypesQueryState = QueryStateFrom<typeof QUERY_STATE>;

interface OrganizationProfileTypesContext {
  showArchived: boolean;
  setShowArchived: (value: boolean) => void;
}

function OrganizationProfileTypes() {
  const intl = useIntl();
  const { data: queryObject } = useAssertQueryOrPreviousData(OrganizationProfileTypes_userDocument);
  const { me } = queryObject;
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);
  const [showArchived, setShowArchived] = useQueryStateSlice(
    queryState,
    setQueryState,
    "showArchived",
  );

  const { data, loading, refetch } = useQueryOrPreviousData(
    OrganizationProfileTypes_profileTypesDocument,
    {
      variables: {
        offset: queryState.items * (queryState.page - 1),
        limit: queryState.items,
        search: queryState.search,
        sortBy: [`${queryState.sort.field}_${queryState.sort.direction}` as const],
        locale: intl.locale as UserLocale,
        filter: {
          onlyArchived: queryState.showArchived,
        },
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const profileTypes = data?.profileTypes;

  const { selectedRows, onChangeSelectedIds } = useSelection(profileTypes?.items, "id");

  const profileTypesColumns = useProfileTypesTableColumns();

  const navigate = useHandleNavigation();
  const handleProfileTypeClick = useCallback(
    (row: OrganizationProfileTypes_ProfileTypeFragment, event: MouseEvent) => {
      navigate(`/app/organization/profiles/types/${row.id}`, event);
    },
    [],
  );

  const [createProfileType] = useMutation(OrganizationProfileTypes_createProfileTypeDocument);
  const showCreateProfileTypeDialog = useCreateProfileTypeDialog();
  const handleCreateNewProfileType = async () => {
    try {
      const { name, pluralName, standardType } = await showCreateProfileTypeDialog({});
      await createProfileType({
        variables: {
          name,
          pluralName,
          standardType,
        },
      });
      refetch();
    } catch {}
  };

  const [cloneProfileType] = useMutation(OrganizationProfileTypes_cloneProfileTypeDocument);
  const showUpdateProfileTypeDialog = useUpdateProfileTypeDialog();
  const handleCloneClick = async () => {
    try {
      const { name, pluralName } = await showUpdateProfileTypeDialog({
        name: selectedRows[0].name,
        pluralName: selectedRows[0].pluralName,
        standardType: selectedRows[0].standardType ?? null,
      });
      await cloneProfileType({
        variables: {
          profileTypeId: selectedRows[0].id,
          name,
          pluralName,
        },
      });
      refetch();
    } catch {}
  };

  const deleteProfileType = useDeleteProfileType();
  const handleDeleteClick = async () => {
    try {
      await deleteProfileType({ profileTypes: selectedRows });
      await refetch();
    } catch {}
  };

  const archiveProfileType = useArchiveProfileType();
  const handleArchiveClick = async () => {
    try {
      await archiveProfileType({ profileTypes: selectedRows });
      await refetch();
    } catch {}
  };

  const unarchiveProfileType = useUnarchiveProfileType();
  const handleUnarchiveClick = async () => {
    try {
      await unarchiveProfileType({ profileTypes: selectedRows });
      await refetch();
    } catch {}
  };

  const actions = useProfileTypesListActions({
    showArchived,
    selectedCount: selectedRows.length,
    onDeleteClick: handleDeleteClick,
    onCloneClick: handleCloneClick,
    onUnarchiveClick: handleUnarchiveClick,
    onArchiveClick: handleArchiveClick,
  });

  const context = useMemo<OrganizationProfileTypesContext>(
    () => ({ showArchived, setShowArchived }),
    [showArchived, setShowArchived],
  );

  return (
    <OrganizationProfilesLayout currentTabKey="types" queryObject={queryObject}>
      <Flex direction="column" flex="1" padding={4} paddingBottom={24}>
        <TablePage
          flex="0 1 auto"
          minHeight="305px"
          columns={profileTypesColumns}
          context={context}
          rows={profileTypes?.items}
          rowKeyProp="id"
          isSelectable
          isHighlightable
          loading={loading}
          onRowClick={handleProfileTypeClick}
          page={queryState.page}
          pageSize={queryState.items}
          totalCount={profileTypes?.totalCount}
          onSelectionChange={onChangeSelectedIds}
          sort={queryState.sort}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
          actions={actions}
          header={
            <ProfileTypesListHeader
              shape={QUERY_STATE}
              state={queryState}
              onStateChange={setQueryState}
              onReload={refetch}
              onCreateType={me.hasCreateProfileType ? handleCreateNewProfileType : undefined}
            />
          }
          body={
            profileTypes && profileTypes.totalCount === 0 && !loading ? (
              queryState.search ? (
                <Center flex="1">
                  <Text color="gray.400" fontSize="lg">
                    <FormattedMessage
                      id="component.profile-types-table.no-results"
                      defaultMessage="There's no profile types matching your criteria"
                    />
                  </Text>
                </Center>
              ) : queryState.showArchived ? (
                <Center flex="1">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="component.profile-types-table.no-profiles-archived"
                      defaultMessage="There are no archived profiles"
                    />
                  </Text>
                </Center>
              ) : (
                <Center flex="1">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="component.profile-types-table.no-profiles"
                      defaultMessage="You have no profile types yet. Start by creating one now!"
                    />
                  </Text>
                </Center>
              )
            ) : null
          }
          Footer={CustomFooter}
        />
      </Flex>
    </OrganizationProfilesLayout>
  );
}

function CustomFooter({
  showArchived,
  setShowArchived,
  children,
}: PropsWithChildren<OrganizationProfileTypesContext>) {
  const options = useSimpleSelectOptions(
    (intl) => [
      {
        label: intl.formatMessage({
          id: "component.profile-types-table.active",
          defaultMessage: "Active",
        }),
        value: "false",
      },
      {
        label: intl.formatMessage({
          id: "component.profile-types-table.archived",
          defaultMessage: "Archived",
        }),
        value: "true",
      },
    ],

    [],
  );
  return (
    <>
      <SimpleMenuSelect
        options={options}
        value={showArchived ? "true" : "false"}
        onChange={(value) => setShowArchived(value === "true")}
        size="sm"
        variant="ghost"
      />

      {children}
    </>
  );
}

function useProfileTypesTableColumns(): TableColumn<
  OrganizationProfileTypes_ProfileTypeFragment,
  any
>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "name",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.name",
          defaultMessage: "Name",
        }),
        cellProps: {
          width: "70%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <LocalizableUserTextRender
              value={row.name}
              default={intl.formatMessage({
                id: "generic.unnamed-profile-type",
                defaultMessage: "Unnamed profile type",
              })}
            />
          );
        },
      },
      {
        key: "createdAt",
        isSortable: true,
        label: intl.formatMessage({
          id: "generic.created-at",
          defaultMessage: "Created at",
        }),
        cellProps: {
          width: "30%",
          minWidth: "180px",
        },
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
        ),
      },
    ],

    [intl.locale],
  );
}

function useProfileTypesListActions({
  showArchived,
  selectedCount,
  onCloneClick,
  onDeleteClick,
  onArchiveClick,
  onUnarchiveClick,
}: {
  showArchived: boolean | null;
  selectedCount: number;
  onCloneClick: () => void;
  onDeleteClick: () => void;
  onArchiveClick: () => void;
  onUnarchiveClick: () => void;
}) {
  return showArchived
    ? [
        {
          key: "unarchive",
          onClick: onUnarchiveClick,
          leftIcon: <ArchiveIcon />,
          children: <FormattedMessage id="generic.unarchive" defaultMessage="Unarchive" />,
        },
        {
          key: "delete",
          onClick: onDeleteClick,
          leftIcon: <DeleteIcon />,
          children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
          colorScheme: "red",
        },
      ]
    : [
        {
          key: "clone",
          onClick: onCloneClick,
          leftIcon: <CopyIcon />,
          children: <FormattedMessage id="generic.duplicate" defaultMessage="Duplicate" />,
          isDisabled: selectedCount !== 1,
        },
        {
          key: "archive",
          onClick: onArchiveClick,
          leftIcon: <ArchiveIcon />,
          children: (
            <FormattedMessage id="component.profile-types-table.archive" defaultMessage="Archive" />
          ),

          colorScheme: "red",
        },
      ];
}

const _fragments = {
  ProfileType: gql`
    fragment OrganizationProfileTypes_ProfileType on ProfileType {
      id
      name
      pluralName
      icon
      createdAt
      archivedAt
      standardType
      ...useDeleteProfileType_ProfileType
      ...useArchiveProfileType_ProfileType
    }
  `,
  ProfileTypePagination: gql`
    fragment OrganizationProfileTypes_ProfileTypePagination on ProfileTypePagination {
      items {
        ...OrganizationProfileTypes_ProfileType
      }
      totalCount
    }
  `,
};

OrganizationProfileTypes.queries = [
  gql`
    query OrganizationProfileTypes_profileTypes(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [QueryProfileTypes_OrderBy!]
      $locale: UserLocale
      $filter: ProfileTypeFilter
    ) {
      profileTypes(
        offset: $offset
        limit: $limit
        search: $search
        sortBy: $sortBy
        locale: $locale
        filter: $filter
      ) {
        ...OrganizationProfileTypes_ProfileTypePagination
      }
    }
  `,
  gql`
    query OrganizationProfileTypes_user {
      ...OrganizationProfilesLayout_Query
      me {
        id
        hasCreateProfileType: hasFeatureFlag(featureFlag: CREATE_PROFILE_TYPE)
      }
    }
  `,
];

OrganizationProfileTypes.mutations = [
  gql`
    mutation OrganizationProfileTypes_createProfileType(
      $name: LocalizableUserText!
      $pluralName: LocalizableUserText!
      $standardType: ProfileTypeStandardType
    ) {
      createProfileType(name: $name, pluralName: $pluralName, standardType: $standardType) {
        ...OrganizationProfileTypes_ProfileType
      }
    }
  `,
  gql`
    mutation OrganizationProfileTypes_cloneProfileType(
      $profileTypeId: GID!
      $name: LocalizableUserText
      $pluralName: LocalizableUserText
    ) {
      cloneProfileType(profileTypeId: $profileTypeId, name: $name, pluralName: $pluralName) {
        ...OrganizationProfileType_ProfileType
      }
    }
  `,
];

OrganizationProfileTypes.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationProfileTypes_userDocument);
};

export default compose(
  withDialogs,
  withPermission("PROFILE_TYPES:CRUD_PROFILE_TYPES", { orPath: "/app/organization" }),
  withFeatureFlag("PROFILES", "/app/organization"),
  withApolloData,
)(OrganizationProfileTypes);
