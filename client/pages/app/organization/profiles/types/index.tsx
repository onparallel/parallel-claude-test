import { gql, useMutation } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { CopyIcon, DeleteIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { useCreateOrUpdateProfileTypeDialog } from "@parallel/components/organization/profiles/dialogs/CreateOrUpdateProfileTypeDialog";
import { OrganizationProfilesLayout } from "@parallel/components/organization/profiles/OrganizationProfilesLayout";
import { ProfileTypesListHeader } from "@parallel/components/organization/profiles/ProfileTypesListHeader";
import {
  OrganizationProfileTypes_cloneProfileTypeDocument,
  OrganizationProfileTypes_createProfileTypeDocument,
  OrganizationProfileTypes_ProfileTypeFragment,
  OrganizationProfileTypes_profileTypesDocument,
  OrganizationProfileTypes_userDocument,
  UserLocale,
} from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useDeleteProfileType } from "@parallel/utils/mutations/useDeleteProfileType";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  integer,
  QueryStateFrom,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useSelection } from "@parallel/utils/useSelectionState";
import { MouseEvent, useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const SORTING = ["name", "createdAt"] as const;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
  sort: sorting(SORTING).orDefault({
    field: "createdAt",
    direction: "ASC",
  }),
};

export type ProfileTypesQueryState = QueryStateFrom<typeof QUERY_STATE>;

function OrganizationProfileTypes() {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationProfileTypes_userDocument);

  const [queryState, setQueryState] = useQueryState(QUERY_STATE);

  const { data, loading, refetch } = useQueryOrPreviousData(
    OrganizationProfileTypes_profileTypesDocument,
    {
      variables: {
        offset: queryState.items * (queryState.page - 1),
        limit: queryState.items,
        search: queryState.search,
        sortBy: [`${queryState.sort.field}_${queryState.sort.direction}` as const],
        locale: intl.locale as UserLocale,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const profileTypes = data?.profileTypes;

  const { selectedRows, onChangeSelectedIds } = useSelection(profileTypes?.items, "id");

  const profileTypesColumns = useProfileTypesTableColumns();

  const navigate = useHandleNavigation();
  const handleProfileTypeClick = useCallback(
    (row: OrganizationProfileTypes_ProfileTypeFragment, event: MouseEvent) => {
      navigate(`/app/organization/profiles/types/${row.id}`, event);
    },
    []
  );

  const [createProfileType] = useMutation(OrganizationProfileTypes_createProfileTypeDocument);
  const showCreateProfileTypeDialog = useCreateOrUpdateProfileTypeDialog();
  const handleCreateNewProfileType = async () => {
    try {
      const { name } = await showCreateProfileTypeDialog({});
      await createProfileType({
        variables: {
          name,
        },
      });
      refetch();
    } catch {}
  };

  const [cloneProfileType] = useMutation(OrganizationProfileTypes_cloneProfileTypeDocument);
  const handleCloneClick = async () => {
    try {
      const { name } = await showCreateProfileTypeDialog({
        isEditing: true,
        name: selectedRows[0].name,
      });
      await cloneProfileType({
        variables: {
          profileTypeId: selectedRows[0].id,
          name,
        },
      });
      refetch();
    } catch {}
  };

  const deleteProfileType = useDeleteProfileType();
  const handleDeleteClick = async () => {
    try {
      await deleteProfileType({ profileTypes: selectedRows });
    } catch {}
  };

  const actions = useProfileTypesListActions({
    selectedCount: selectedRows.length,
    onDeleteClick: handleDeleteClick,
    onCloneClick: handleCloneClick,
  });

  return (
    <OrganizationProfilesLayout tabKey="types" me={me} realMe={realMe}>
      <Box flex="1" padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          columns={profileTypesColumns}
          rows={profileTypes?.items}
          rowKeyProp="id"
          context={me}
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
              onCreateType={handleCreateNewProfileType}
            />
          }
          body={
            profileTypes && profileTypes.totalCount === 0 && !loading ? (
              queryState.search ? (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text color="gray.300" fontSize="lg">
                    <FormattedMessage
                      id="component.profile-types-table.no-results"
                      defaultMessage="There's no profile types matching your criteria"
                    />
                  </Text>
                </Flex>
              ) : (
                <Flex flex="1" alignItems="center" justifyContent="center">
                  <Text fontSize="lg">
                    <FormattedMessage
                      id="component.profile-types-table.no-profiles"
                      defaultMessage="You have no profile types yet. Start by creating one now!"
                    />
                  </Text>
                </Flex>
              )
            ) : null
          }
        />
      </Box>
    </OrganizationProfilesLayout>
  );
}

function useProfileTypesTableColumns(): TableColumn<OrganizationProfileTypes_ProfileTypeFragment>[] {
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
          width: "70%",
          minWidth: "240px",
        },
        CellContent: ({ row }) => {
          return (
            <LocalizableUserTextRender
              value={row.name}
              default={intl.formatMessage({
                id: "generic.unamed-profile-type",
                defaultMessage: "Unnamed profile type",
              })}
            />
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
          width: "30%",
          minWidth: "180px",
        },
        CellContent: ({ row: { createdAt } }) => (
          <DateTime value={createdAt} format={FORMATS.LLL} whiteSpace="nowrap" />
        ),
      },
    ],
    [intl.locale]
  );
}

function useProfileTypesListActions({
  selectedCount,
  onCloneClick,
  onDeleteClick,
}: {
  selectedCount: number;
  onCloneClick: () => void;
  onDeleteClick: () => void;
}) {
  return [
    {
      key: "clone",
      onClick: onCloneClick,
      leftIcon: <CopyIcon />,
      children: <FormattedMessage id="generic.duplicate" defaultMessage="Duplicate" />,
      isDisabled: selectedCount !== 1,
    },

    {
      key: "delete",
      onClick: onDeleteClick,
      leftIcon: <DeleteIcon />,
      children: <FormattedMessage id="generic.delete" defaultMessage="Delete" />,
      colorScheme: "red",
    },
  ];
}

OrganizationProfileTypes.fragments = {
  get ProfileType() {
    return gql`
      fragment OrganizationProfileTypes_ProfileType on ProfileType {
        id
        name
        createdAt
        ...useDeleteProfileType_ProfileType
      }
      ${useDeleteProfileType.fragments.ProfileType}
    `;
  },
  get ProfileTypePagination() {
    return gql`
      fragment OrganizationProfileTypes_ProfileTypePagination on ProfileTypePagination {
        items {
          ...OrganizationProfileTypes_ProfileType
        }
        totalCount
      }
      ${this.ProfileType}
    `;
  },
};

OrganizationProfileTypes.queries = [
  gql`
    query OrganizationProfileTypes_profileTypes(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [QueryProfileTypes_OrderBy!]
      $locale: UserLocale
    ) {
      profileTypes(
        offset: $offset
        limit: $limit
        search: $search
        sortBy: $sortBy
        locale: $locale
      ) {
        ...OrganizationProfileTypes_ProfileTypePagination
      }
    }
    ${OrganizationProfileTypes.fragments.ProfileTypePagination}
  `,
  gql`
    query OrganizationProfileTypes_user {
      ...OrganizationProfilesLayout_Query
    }
    ${OrganizationProfilesLayout.fragments.Query}
  `,
];

OrganizationProfileTypes.mutations = [
  gql`
    mutation OrganizationProfileTypes_createProfileType($name: LocalizableUserText!) {
      createProfileType(name: $name) {
        ...OrganizationProfileTypes_ProfileType
      }
    }
    ${OrganizationProfileTypes.fragments.ProfileType}
  `,
  gql`
    mutation OrganizationProfileTypes_cloneProfileType(
      $profileTypeId: GID!
      $name: LocalizableUserText
    ) {
      cloneProfileType(profileTypeId: $profileTypeId, name: $name) {
        ...OrganizationProfileType_ProfileType
      }
    }
    ${OrganizationProfileTypes.fragments.ProfileType}
  `,
];

OrganizationProfileTypes.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(OrganizationProfileTypes_userDocument);
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/organization"),
  withApolloData
)(OrganizationProfileTypes);
