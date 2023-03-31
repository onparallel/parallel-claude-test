import { gql } from "@apollo/client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { useCreateOrEditProfileTypeDialog } from "@parallel/components/organization/profiles/dialogs/CreateOrEditProfileTypeDialog";
import { OrganizationProfilesLayout } from "@parallel/components/organization/profiles/OrganizationProfilesLayout";
import { ProfileTypesListHeader } from "@parallel/components/organization/profiles/ProfileTypesListHeader";
import { OrganizationProfileTypes_userDocument } from "@parallel/graphql/__types";
import { useAssertQueryOrPreviousData } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  integer,
  QueryStateFrom,
  sorting,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
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
  const {
    data: { me, realMe },
  } = useAssertQueryOrPreviousData(OrganizationProfileTypes_userDocument);

  const [queryState, setQueryState] = useQueryState(QUERY_STATE);

  const profileTypesColumns = useProfileTypesTableColumns();
  const loading = false;

  const navigate = useHandleNavigation();
  const handleProfileTypeClick = useCallback((row: any, event: MouseEvent) => {
    navigate(`/app/organization/profiles/${row.id}`, event);
  }, []);

  const showCreateProfileTypeDialog = useCreateOrEditProfileTypeDialog();
  const handleCreateNewProfileType = async () => {
    try {
      const data = await showCreateProfileTypeDialog({});
      console.log("showCreateProfileTypeDialog data: ", data);
    } catch {}
  };

  return (
    <OrganizationProfilesLayout tabKey="types" me={me} realMe={realMe}>
      <Box flex="1" padding={4} paddingBottom={16}>
        <TablePage
          flex="0 1 auto"
          minHeight={0}
          columns={profileTypesColumns}
          rows={[] as any[]}
          rowKeyProp="id"
          context={me}
          isSelectable
          isHighlightable
          loading={loading}
          onRowClick={handleProfileTypeClick}
          page={queryState.page}
          pageSize={queryState.items}
          totalCount={300}
          onSelectionChange={() => {}}
          sort={queryState.sort}
          onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
          onPageSizeChange={(items) =>
            setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
          }
          onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
          header={
            <ProfileTypesListHeader
              shape={QUERY_STATE}
              state={queryState}
              onStateChange={setQueryState}
              onReload={() => {}}
              onCreateType={handleCreateNewProfileType}
            />
          }
          body={
            !loading ? (
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

function useProfileTypesTableColumns(): TableColumn<any>[] {
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
          return <Text as="span">{row.name}</Text>;
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

OrganizationProfileTypes.queries = [
  gql`
    query OrganizationProfileTypes_user {
      ...OrganizationProfilesLayout_Query
    }
    ${OrganizationProfilesLayout.fragments.Query}
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
