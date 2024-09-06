import { gql } from "@apollo/client";
import { Box, Center, Flex, Heading, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { RepeatIcon, TimeAlarmIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { NormalLink } from "@parallel/components/common/Link";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { UserAvatarList } from "@parallel/components/common/UserAvatarList";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withFeatureFlag } from "@parallel/components/common/withFeatureFlag";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  Alerts_expiringProfilePropertiesDocument,
  Alerts_ProfileFieldPropertyFragment,
  Alerts_userDocument,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { useHandleNavigation } from "@parallel/utils/navigation";
import {
  integer,
  QueryStateFrom,
  QueryStateOf,
  SetQueryState,
  string,
  useQueryState,
  values,
} from "@parallel/utils/queryState";
import { useDebouncedCallback } from "@parallel/utils/useDebouncedCallback";
import { isPast, sub } from "date-fns";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([10, 25, 50]).orDefault(10),
  search: string(),
};

type AlertsQueryState = QueryStateFrom<typeof QUERY_STATE>;

function Alerts() {
  const intl = useIntl();

  const {
    data: { me, realMe },
  } = useAssertQuery(Alerts_userDocument);
  const [queryState, setQueryState] = useQueryState(QUERY_STATE);

  const { data, loading, refetch } = useQueryOrPreviousData(
    Alerts_expiringProfilePropertiesDocument,
    {
      variables: {
        offset: queryState.items * (queryState.page - 1),
        limit: queryState.items,
        search: queryState.search,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const items = data?.expiringProfileProperties.items;
  const totalCount = data?.expiringProfileProperties.totalCount ?? 0;

  const columns = useAlertsTableColumns();
  const context = useMemo(() => ({ user: me! }), [me]);

  const navigate = useHandleNavigation();
  const handleRowClick = useCallback((row: Alerts_ProfileFieldPropertyFragment, event: any) => {
    navigate(`/app/profiles/${row.profile.id}?field=${row.field.id}`, event);
  }, []);

  return (
    <AppLayout
      title={intl.formatMessage({ id: "page.alerts.title", defaultMessage: "Alerts" })}
      me={me}
      realMe={realMe}
    >
      <Stack minHeight={0} paddingX={4} paddingTop={6} spacing={4}>
        <HStack padding={2}>
          <TimeAlarmIcon boxSize={5} />
          <Heading as="h2" size="lg">
            <FormattedMessage id="page.alerts.title" defaultMessage="Alerts" />
          </Heading>
        </HStack>
        <Box flex="1" paddingBottom={16}>
          <TablePage
            flex="0 1 auto"
            columns={columns}
            rows={items}
            rowKeyProp={(row) => [row.profile.id, row.field.id].join(":")}
            context={context}
            isHighlightable
            loading={loading}
            onRowClick={handleRowClick}
            page={queryState.page}
            pageSize={queryState.items}
            totalCount={totalCount}
            onPageChange={(page) => setQueryState((s) => ({ ...s, page }))}
            onPageSizeChange={(items) =>
              setQueryState((s) => ({ ...s, items: items as any, page: 1 }))
            }
            onSortChange={(sort) => setQueryState((s) => ({ ...s, sort, page: 1 }))}
            header={
              <AlertsListHeader
                shape={QUERY_STATE}
                state={queryState}
                onStateChange={setQueryState}
                onReload={refetch}
              />
            }
            body={
              totalCount === 0 && !loading ? (
                queryState.search ? (
                  <Center flex="1">
                    <Text color="gray.400" fontSize="lg">
                      <FormattedMessage
                        id="page.alerts.no-results"
                        defaultMessage="There's no alerts matching your criteria"
                      />
                    </Text>
                  </Center>
                ) : (
                  <Stack
                    flex="1"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    padding={4}
                  >
                    <Image
                      paddingBottom={2}
                      src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/alerts/empty-alerts.svg`}
                    />
                    <Text fontWeight="bold">
                      <FormattedMessage
                        id="page.alerts.no-alerts"
                        defaultMessage="You have no alerts set up"
                      />
                    </Text>
                    <Text>
                      <FormattedMessage
                        id="page.alerts.no-alerts-body"
                        defaultMessage="Alerts are automatically created when an expiration date is added to a profile"
                      />
                    </Text>
                    <NormalLink as={NakedHelpCenterLink} articleId={8174034} fontWeight="bold">
                      <FormattedMessage
                        id="page.alerts.no-alerts-help-center-link"
                        defaultMessage="How to add alerts"
                      />
                    </NormalLink>
                  </Stack>
                )
              ) : null
            }
          />
        </Box>
      </Stack>
    </AppLayout>
  );
}

interface AlertsListHeaderProps {
  shape: QueryStateOf<AlertsQueryState>;
  state: AlertsQueryState;
  onStateChange: SetQueryState<Partial<AlertsQueryState>>;
  onReload: () => void;
}

function AlertsListHeader({ shape, state, onStateChange, onReload }: AlertsListHeaderProps) {
  const intl = useIntl();
  const [search, setSearch] = useState(state.search ?? "");

  const debouncedOnSearchChange = useDebouncedCallback(
    (search) =>
      onStateChange(({ ...current }) => ({
        ...current,
        search,
        page: 1,
      })),
    300,
    [onStateChange],
  );

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearch(value);
      debouncedOnSearchChange(value || null);
    },
    [debouncedOnSearchChange],
  );

  return (
    <HStack padding={2}>
      <IconButtonWithTooltip
        onClick={() => onReload()}
        icon={<RepeatIcon />}
        placement="bottom"
        variant="outline"
        label={intl.formatMessage({
          id: "generic.reload-data",
          defaultMessage: "Reload",
        })}
      />
      <Box flex="0 1 400px">
        <SearchInput value={search ?? ""} onChange={handleSearchChange} />
      </Box>
    </HStack>
  );
}

function useAlertsTableColumns(): TableColumn<Alerts_ProfileFieldPropertyFragment>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "status",
        label: "",
        CellContent: ({ row }) => {
          const expiryDate = row.value?.expiryDate ?? row.files![0].expiryDate!;
          const expiresAt = row.value?.expiresAt ?? row.files![0].expiresAt!;
          const expiryAlertAheadTime = row.field.expiryAlertAheadTime!;

          const alertActivationAt = sub(new Date(expiresAt), expiryAlertAheadTime);
          const alertActivationDate = sub(new Date(expiryDate), expiryAlertAheadTime);
          if (isPast(alertActivationAt)) {
            return (
              <SmallPopover
                content={
                  <Box fontSize="sm">
                    <FormattedMessage
                      id="component.use-alerts-table-columns.alert-active-help"
                      defaultMessage="The property is expired or about to expire. Update it to deactivate this alert."
                    />
                  </Box>
                }
              >
                <TimeAlarmIcon color="yellow.500" />
              </SmallPopover>
            );
          } else {
            return (
              <SmallPopover
                content={
                  <Box fontSize="sm">
                    <FormattedMessage
                      id="component.use-alerts-table-columns.alert-inactive-help"
                      defaultMessage="The alert will be activated on {date}."
                      values={{
                        date: intl.formatDate(alertActivationDate, {
                          ...FORMATS.LL,
                          timeZone: "UTC",
                        }),
                      }}
                    />
                  </Box>
                }
              >
                <TimeAlarmIcon color="gray.400" />
              </SmallPopover>
            );
          }
        },
      },
      {
        key: "profile",
        label: intl.formatMessage({
          id: "component.alerts-table-columns.profile",
          defaultMessage: "Profile",
        }),
        headerProps: {
          minWidth: "240px",
        },
        cellProps: {
          maxWidth: 0,
          minWidth: "240px",
        },
        CellContent: ({ row: { profile } }) => {
          return (
            <OverflownText>
              <ProfileReference profile={profile} />
            </OverflownText>
          );
        },
      },
      {
        key: "property",
        label: intl.formatMessage({
          id: "component.alerts-table-columns.property",
          defaultMessage: "Property",
        }),
        headerProps: {
          minWidth: "240px",
        },
        cellProps: {
          maxWidth: 0,
          minWidth: "240px",
        },
        CellContent: ({
          row: {
            field: { name },
          },
        }) => {
          return (
            <OverflownText>
              <LocalizableUserTextRender
                value={name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type-field",
                  defaultMessage: "Unnamed property",
                })}
              />
            </OverflownText>
          );
        },
      },
      {
        key: "expirationDate",
        label: intl.formatMessage({
          id: "component.alerts-table-columns.expiration-date",
          defaultMessage: "Expiration date",
        }),
        headerProps: {
          minWidth: "220px",
        },
        cellProps: {
          minWidth: "220px",
        },
        CellContent: ({ row }) => {
          const expiresAt = row.value?.expiresAt ?? row.files![0].expiresAt!;
          const expiryDate = row.value?.expiryDate ?? row.files![0].expiryDate!;
          return (
            <DateTime
              color={isPast(new Date(expiresAt)) ? "red.600" : undefined}
              value={expiryDate}
              format={{ ...FORMATS.LL, timeZone: "UTC" }}
              whiteSpace="nowrap"
            />
          );
        },
      },
      {
        key: "subscribers",
        label: intl.formatMessage({
          id: "component.alerts-table-columns.subscribers",
          defaultMessage: "Subscribers",
        }),
        headerProps: {
          minWidth: "240px",
        },
        cellProps: {
          minWidth: "240px",
        },
        CellContent: ({ row, column }) => {
          return (
            <Flex justifyContent={column.align}>
              <UserAvatarList usersOrGroups={row.profile.subscribers.map((s) => s.user)} />
            </Flex>
          );
        },
      },
      {
        key: "profileType",
        label: intl.formatMessage({
          id: "component.alerts-table-columns.profile-type",
          defaultMessage: "Profile Type",
        }),
        headerProps: {
          minWidth: "240px",
        },
        cellProps: {
          minWidth: "240px",
        },
        CellContent: ({
          row: {
            profile: {
              profileType: { name },
            },
          },
        }) => {
          return (
            <Text as="span">
              <LocalizableUserTextRender
                value={name}
                default={intl.formatMessage({
                  id: "generic.unnamed-profile-type",
                  defaultMessage: "Unnamed profile type",
                })}
              />
            </Text>
          );
        },
      },
    ],
    [intl.locale],
  );
}

const _fragments = {
  ProfileFieldProperty: gql`
    fragment Alerts_ProfileFieldProperty on ProfileFieldProperty {
      field {
        id
        name
        isExpirable
        expiryAlertAheadTime
      }
      profile {
        id
        localizableName
        status
        profileType {
          id
          name
        }
        subscribers {
          id
          user {
            id
            ...UserAvatarList_User
          }
        }
      }
      value {
        id
        expiresAt
        expiryDate
      }
      files {
        id
        expiresAt
        expiryDate
      }
    }
    ${UserAvatarList.fragments.User}
  `,
};

const _queries = [
  gql`
    query Alerts_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
  gql`
    query Alerts_expiringProfileProperties(
      $offset: Int
      $limit: Int
      $search: String
      $filter: ProfilePropertyFilter
    ) {
      expiringProfileProperties(offset: $offset, limit: $limit, search: $search, filter: $filter) {
        items {
          ...Alerts_ProfileFieldProperty
        }
        totalCount
      }
    }
    ${_fragments.ProfileFieldProperty}
  `,
];

Alerts.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await Promise.all([fetchQuery(Alerts_userDocument)]);
  return {};
};

export default compose(
  withDialogs,
  withFeatureFlag("PROFILES", "/app/petitions"),
  withApolloData,
)(Alerts);
