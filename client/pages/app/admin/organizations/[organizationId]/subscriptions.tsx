import { gql, useMutation } from "@apollo/client";
import { Badge, Button, Center, Flex, Grid, HStack, Stack, Text } from "@chakra-ui/react";
import { AdminOrganizationsLayout } from "@parallel/components/admin-organizations/AdminOrganizationsLayout";
import { AdminOrganizationsSubscriptionCard } from "@parallel/components/admin-organizations/AdminOrganizationsSubscriptionCard";
import {
  UpdateOrganizationCurrentUsagePeriodDialog,
  useUpdateOrganizationCurrentUsagePeriodDialog,
} from "@parallel/components/admin-organizations/dialogs/UpdateOrganizationCurrentUsagePeriodDialog";
import {
  UpdateOrganizationUsageDetailsDialog,
  useUpdateOrganizationUsageDetailsDialog,
} from "@parallel/components/admin-organizations/dialogs/UpdateOrganizationUsageDetailsDialog";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { TableColumn } from "@parallel/components/common/Table";
import { TablePage } from "@parallel/components/common/TablePage";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { TimeSpan } from "@parallel/components/reports/common/TimeSpan";
import {
  AdminOrganizationsSubscriptions_modifyCurrentUsagePeriodDocument,
  AdminOrganizationsSubscriptions_organizationUsagePeriodsQueryDocument,
  AdminOrganizationsSubscriptions_queryDocument,
  AdminOrganizationsSubscriptions_shareSignaturitApiKeyDocument,
  AdminOrganizationsSubscriptions_updateOrganizationUsageDetailsDocument,
  AdminOrganizationsSubscriptions_updateOrganizationUserLimitDocument,
  OrganizationUsageLimitName,
  OrganizationUsagePeriodsTable_OrganizationUsageLimitFragment,
  OrganizationUsagePeriodsTable_OrganizationUsageLimitPaginationFragment,
} from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { useQueryOrPreviousData } from "@parallel/utils/apollo/useQueryOrPreviousData";
import { compose } from "@parallel/utils/compose";
import { FORMATS } from "@parallel/utils/dates";
import { integer, sorting, useQueryState, values } from "@parallel/utils/queryState";
import { UnwrapPromise } from "@parallel/utils/types";
import { add, Duration } from "date-fns";
import { useMemo } from "react";
import { FormattedDate, FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
type AdminOrganizationsSubscriptionsProps = UnwrapPromise<
  ReturnType<typeof AdminOrganizationsSubscriptions.getInitialProps>
>;

const QUERY_STATE = {
  page: integer({ min: 1 }).orDefault(1),
  items: values([5, 10, 25]).orDefault(5),
  limitName: values<OrganizationUsageLimitName>([
    "PETITION_SEND",
    "SIGNATURIT_SHARED_APIKEY",
  ]).orDefault("PETITION_SEND"),
  sort: sorting(["periodEndDate"]).orDefault({
    field: "periodEndDate",
    direction: "DESC",
  }),
};
function AdminOrganizationsSubscriptions({ organizationId }: AdminOrganizationsSubscriptionsProps) {
  const {
    data: { me, realMe, ...data },
  } = useAssertQuery(AdminOrganizationsSubscriptions_queryDocument, {
    variables: { id: organizationId },
  });

  const [tableState, setQueryState] = useQueryState(QUERY_STATE);
  const {
    data: tableData,
    loading: tableLoading,
    refetch: tableRefetch,
  } = useQueryOrPreviousData(
    AdminOrganizationsSubscriptions_organizationUsagePeriodsQueryDocument,
    {
      variables: {
        orgId: organizationId,
        limitName: tableState.limitName,
        limit: tableState.items,
        offset: tableState.items * (tableState.page - 1),
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const organization = data.organization!;
  const intl = useIntl();

  const showUpdateOrganizationUsageDetailsDialog = useUpdateOrganizationUsageDetailsDialog();

  const [updateOrganizationUserLimit] = useMutation(
    AdminOrganizationsSubscriptions_updateOrganizationUserLimitDocument,
  );
  async function handleUpdateOrganizationUsersSubscription() {
    try {
      const { limit } = await showUpdateOrganizationUsageDetailsDialog({
        hidePeriodSection: true,
        header: intl.formatMessage({
          id: "page.admin-organizations-subscriptions.users-header",
          defaultMessage: "Users",
        }),
        usageDetails: { limit: organization.usageDetails.USER_LIMIT },
      });
      await updateOrganizationUserLimit({
        variables: { orgId: organizationId, limit },
      });
    } catch {}
  }

  const [updateOrganizationUsageDetails] = useMutation(
    AdminOrganizationsSubscriptions_updateOrganizationUsageDetailsDocument,
  );
  async function handleUpdateOrganizationPetitionsSubscription() {
    try {
      const details = organization.usageDetails.PETITION_SEND;
      const result = await showUpdateOrganizationUsageDetailsDialog({
        header: intl.formatMessage({
          id: "page.admin-organizations-subscriptions.petitions-header",
          defaultMessage: "Parallels",
        }),
        usageDetails: {
          limit: details.limit,
          duration: details.duration,
          renewalCycles: details.renewal_cycles,
        },
        currentUsageLimit: organization.petitionsPeriod,
      });
      await updateOrganizationUsageDetails({
        variables: {
          orgId: organizationId,
          limit: result.limit,
          limitName: "PETITION_SEND",
          duration: result.duration,
          startNewPeriod: result.startNewPeriod,
          renewalCycles: result.renewalCycles,
        },
      });
      if (tableState.limitName === "PETITION_SEND" && result.startNewPeriod) {
        await tableRefetch({
          limitName: "PETITION_SEND",
          limit: tableState.items,
          offset: tableState.items * (tableState.page - 1),
          orgId: organizationId,
        });
      }
    } catch {}
  }
  const [shareSignaturitApiKey] = useMutation(
    AdminOrganizationsSubscriptions_shareSignaturitApiKeyDocument,
  );
  async function handleUpdateOrganizationSignaturesSubscription() {
    try {
      const result = await showUpdateOrganizationUsageDetailsDialog({
        header: intl.formatMessage({
          id: "page.admin-organizations-subscriptions.signatures-header",
          defaultMessage: "Signatures",
        }),
        usageDetails: organization.usageDetails.SIGNATURIT_SHARED_APIKEY,
        currentUsageLimit: organization.signaturesPeriod,
      });
      if (!organization.usageDetails.SIGNATURIT_SHARED_APIKEY) {
        await shareSignaturitApiKey({
          variables: {
            orgId: organizationId,
            limit: result.limit,
            duration: result.duration,
          },
        });
      } else {
        await updateOrganizationUsageDetails({
          variables: {
            orgId: organizationId,
            limit: result.limit,
            limitName: "SIGNATURIT_SHARED_APIKEY",
            duration: result.duration,
            startNewPeriod: result.startNewPeriod,
            renewalCycles: result.renewalCycles,
          },
        });
      }
      if (tableState.limitName === "SIGNATURIT_SHARED_APIKEY" && result.startNewPeriod) {
        await tableRefetch({
          limitName: "SIGNATURIT_SHARED_APIKEY",
          limit: tableState.items,
          offset: tableState.items * (tableState.page - 1),
          orgId: organizationId,
        });
      }
    } catch {}
  }

  const showUpdateOrganizationCurrentUsagePeriodDialog =
    useUpdateOrganizationCurrentUsagePeriodDialog();
  const [modifyCurrentUsagePeriod] = useMutation(
    AdminOrganizationsSubscriptions_modifyCurrentUsagePeriodDocument,
  );
  async function handleModifyCurrentUsagePeriod() {
    try {
      const usagePeriod = tableData?.organization?.usagePeriods.items.find((i) => !i.periodEndDate);
      const result = await showUpdateOrganizationCurrentUsagePeriodDialog({
        header:
          tableState.limitName === "PETITION_SEND"
            ? intl.formatMessage({
                id: "page.admin-organizations-subscriptions.update-.current-petitions-header",
                defaultMessage: "Ongoing parallels period",
              })
            : intl.formatMessage({
                id: "page.admin-organizations-subscriptions.update-.current-signatures-header",
                defaultMessage: "Ongoing signatures period",
              }),
        usagePeriod,
      });
      await modifyCurrentUsagePeriod({
        variables: {
          orgId: organizationId,
          limitName: tableState.limitName,
          newLimit: result.limit,
        },
      });

      await tableRefetch({
        limitName: tableState.limitName,
        limit: tableState.items,
        offset: tableState.items * (tableState.page - 1),
        orgId: organizationId,
      });
    } catch {}
  }

  const petitionSendDetails = organization.usageDetails.PETITION_SEND;
  const signaturitApiKeyDetails = organization.usageDetails.SIGNATURIT_SHARED_APIKEY;
  const remainingCycles = (() => {
    return {
      PETITION_SEND: petitionSendDetails.renewal_cycles
        ? petitionSendDetails.renewal_cycles -
          (tableData?.organization?.petitionsPeriod?.cycleNumber ?? 0)
        : "-",
      SIGNATURIT_SHARED_APIKEY: signaturitApiKeyDetails?.renewal_cycles
        ? signaturitApiKeyDetails.renewal_cycles -
          (tableData?.organization?.signaturesPeriod?.cycleNumber ?? 0)
        : "-",
    };
  })();

  return (
    <AdminOrganizationsLayout
      currentTabKey="subscriptions"
      me={me}
      organization={organization}
      realMe={realMe}
    >
      <Stack padding={4} spacing={4} paddingBottom={24}>
        <Grid gap={4} templateColumns={{ base: "auto", lg: "1fr 1fr 1fr" }}>
          <AdminOrganizationsSubscriptionCard
            headerLabel={intl.formatMessage({
              id: "page.admin-organizations-subscriptions.users-header",
              defaultMessage: "Users",
            })}
            onAction={handleUpdateOrganizationUsersSubscription}
          >
            <Grid as="dl" templateColumns="auto 1fr" gap={4} width="100%">
              <Text as="dt" fontWeight="600">
                <FormattedMessage
                  id="page.admin-organizations-subscriptions.card-users"
                  defaultMessage="Users"
                />
              </Text>
              <Text as="dd">{organization.activeUserCount}</Text>
              <Text as="dt" fontWeight="600">
                <FormattedMessage
                  id="page.admin-organizations-subscriptions.card-limit"
                  defaultMessage="Limit"
                />
              </Text>
              <Text as="dd">{organization.usageDetails.USER_LIMIT}</Text>
            </Grid>
          </AdminOrganizationsSubscriptionCard>
          <AdminOrganizationsSubscriptionCard
            headerLabel={intl.formatMessage({
              id: "page.admin-organizations-subscriptions.petitions-header",
              defaultMessage: "Parallels",
            })}
            onAction={handleUpdateOrganizationPetitionsSubscription}
          >
            <Grid as="dl" templateColumns="auto 1fr" gap={4} width="100%">
              <Text as="dt" fontWeight="600">
                <FormattedMessage
                  id="page.admin-organizations-subscriptions.card-limit"
                  defaultMessage="Limit"
                />
              </Text>
              <Text as="dd"> {organization.usageDetails.PETITION_SEND.limit}</Text>
              <Text as="dt" fontWeight="600">
                <FormattedMessage
                  id="page.admin-organizations-subscriptions.card-period"
                  defaultMessage="Period"
                />
              </Text>
              <Text as="dd">
                <TimeSpan duration={organization.usageDetails.PETITION_SEND.duration} />
              </Text>
              <Text as="dt" fontWeight="600">
                <FormattedMessage
                  id="page.admin-organizations-subscriptions.card-remaining-cycles"
                  defaultMessage="Remaining cycles"
                />
              </Text>
              <Text as="dd">{remainingCycles.PETITION_SEND}</Text>
              <Text as="dt" fontWeight="600">
                <FormattedMessage
                  id="page.admin-organizations-subscriptions.card-end-date"
                  defaultMessage="Subscription end"
                />
              </Text>
              {organization.petitionsSubscriptionEndDate ? (
                <Text as="dd">
                  <FormattedDate
                    value={organization.petitionsSubscriptionEndDate}
                    {...FORMATS["LL"]}
                  />
                </Text>
              ) : (
                <Text as="dd" textStyle="hint">
                  <FormattedMessage id="generic.unlimited" defaultMessage="Unlimited" />
                </Text>
              )}
            </Grid>
          </AdminOrganizationsSubscriptionCard>
          <AdminOrganizationsSubscriptionCard
            headerLabel={intl.formatMessage({
              id: "page.admin-organizations-subscriptions.signatures-header",
              defaultMessage: "Signatures",
            })}
            buttonLabel={
              !isDefined(organization.usageDetails.SIGNATURIT_SHARED_APIKEY)
                ? intl.formatMessage({
                    id: "page.admin-organizations-subscriptions.activate-signature-button",
                    defaultMessage: "Activate signature",
                  })
                : null
            }
            onAction={handleUpdateOrganizationSignaturesSubscription}
          >
            {isDefined(organization.usageDetails.SIGNATURIT_SHARED_APIKEY) ? (
              <Grid as="dl" templateColumns="auto 1fr" gap={4} width="100%">
                <Text as="dt" fontWeight="600">
                  <FormattedMessage
                    id="page.admin-organizations-subscriptions.card-limit"
                    defaultMessage="Limit"
                  />
                </Text>
                <Text as="dd">{organization.usageDetails.SIGNATURIT_SHARED_APIKEY.limit}</Text>
                <Text as="dt" fontWeight="600">
                  <FormattedMessage
                    id="page.admin-organizations-subscriptions.card-period"
                    defaultMessage="Period"
                  />
                </Text>
                <Text as="dd">
                  <TimeSpan
                    duration={organization.usageDetails.SIGNATURIT_SHARED_APIKEY.duration}
                  />
                </Text>
                <Text as="dt" fontWeight="600">
                  <FormattedMessage
                    id="page.admin-organizations-subscriptions.card-remaining-cycles"
                    defaultMessage="Remaining cycles"
                  />
                </Text>
                <Text as="dd">{remainingCycles.SIGNATURIT_SHARED_APIKEY}</Text>
                <Text as="dt" fontWeight="600">
                  <FormattedMessage
                    id="page.admin-organizations-subscriptions.card-end-date"
                    defaultMessage="Subscription end"
                  />
                </Text>
                {organization.signaturitSubscriptionEndDate ? (
                  <Text as="dd">
                    <FormattedDate
                      value={organization.signaturitSubscriptionEndDate}
                      {...FORMATS["LL"]}
                    />
                  </Text>
                ) : (
                  <Text as="dd" textStyle="hint">
                    <FormattedMessage id="generic.unlimited" defaultMessage="Unlimited" />
                  </Text>
                )}
              </Grid>
            ) : (
              <Center width="100%" marginY="auto" textAlign="center">
                <FormattedMessage
                  id="page.admin-organizations-subscriptions.signatures-card.not-active"
                  defaultMessage="The eSignature has not been activated in this organization"
                />
              </Center>
            )}
          </AdminOrganizationsSubscriptionCard>
        </Grid>
        <OrganizationUsagePeriodsTable
          isLoading={tableLoading}
          items={tableData?.organization?.usagePeriods}
          tableState={tableState}
          onTableStateChange={setQueryState}
          onModifyCurrentPeriod={handleModifyCurrentUsagePeriod}
        />
      </Stack>
    </AdminOrganizationsLayout>
  );
}

type TableRow = OrganizationUsagePeriodsTable_OrganizationUsageLimitFragment;
interface OrganizationUsagePeriodsTableProps<
  TState = {
    page: number;
    items: NonNullable<5 | 10 | 25 | null>;
    limitName: OrganizationUsageLimitName;
  },
> {
  items?: OrganizationUsagePeriodsTable_OrganizationUsageLimitPaginationFragment;
  isLoading: boolean;
  tableState: TState;
  onTableStateChange: (state: TState) => void;
  onModifyCurrentPeriod: () => void;
}

export function OrganizationUsagePeriodsTable({
  items,
  isLoading,
  tableState,
  onTableStateChange,
  onModifyCurrentPeriod,
}: OrganizationUsagePeriodsTableProps) {
  const intl = useIntl();

  const columns = useMemo(
    () =>
      [
        {
          key: "periodBadge",
          label: intl.formatMessage({
            id: "component.organization-usage-periods-table.period-badge.header",
            defaultMessage: "Period",
          }),
          CellContent: ({ row }) =>
            row.periodEndDate ? (
              <Badge>
                <FormattedMessage
                  id="component.organization-usage-periods-table.period-badge.past"
                  defaultMessage="Past"
                />
              </Badge>
            ) : (
              <Badge colorScheme="primary">
                <FormattedMessage
                  id="component.organization-usage-periods-table.period-badge.ongoing"
                  defaultMessage="Ongoing"
                />
              </Badge>
            ),
        },
        {
          key: "used",
          label: intl.formatMessage({
            id: "component.organization-usage-periods-table.used.header",
            defaultMessage: "Used",
          }),
          CellContent: ({ row }) => row.used,
        },
        {
          key: "limit",
          label: intl.formatMessage({
            id: "component.organization-usage-periods-table.limit.header",
            defaultMessage: "Limit",
          }),
          CellContent: ({ row }) => row.limit,
        },
        {
          key: "period",
          label: intl.formatMessage({
            id: "component.organization-usage-periods-table.period.header",
            defaultMessage: "Period",
          }),
          CellContent: ({ row }) => <TimeSpan duration={row.period as Duration} />,
        },
        {
          key: "periodStartDate",
          label: intl.formatMessage({
            id: "component.organization-usage-periods-table.period-start-date.header",
            defaultMessage: "Start date",
          }),
          CellContent: ({ row }) => (
            <FormattedDate value={row.periodStartDate} {...FORMATS["LLL"]} />
          ),
        },
        {
          key: "periodEndDate",
          label: intl.formatMessage({
            id: "component.organization-usage-periods-table.period-end-date.header",
            defaultMessage: "Period end date",
          }),
          CellContent: ({ row }) => (
            <FormattedDate
              value={
                row.periodEndDate ?? add(new Date(row.periodStartDate), row.period as Duration)
              }
              {...FORMATS["LLL"]}
            />
          ),
        },
      ] as TableColumn<TableRow>[],
    [intl.locale],
  );

  return (
    <TablePage<TableRow>
      rowKeyProp="id"
      columns={columns}
      rows={items?.items}
      totalCount={items?.totalCount}
      loading={isLoading}
      page={tableState.page}
      onPageChange={(page) => onTableStateChange({ ...tableState, page })}
      pageSize={tableState.items}
      onPageSizeChange={(items) => onTableStateChange({ ...tableState, items: items as any })}
      pageSizeOptions={[5, 10, 25]}
      header={
        <Flex
          direction={{ base: "column", md: "row" }}
          justifyContent="space-between"
          paddingX={4}
          paddingY={2}
          wrap="wrap"
          gap={2}
        >
          <HStack fontWeight="bold" minWidth="0">
            <FormattedMessage
              id="component.organization-usage-periods-table.selector-label"
              defaultMessage="Periods of {selector}"
              values={{
                selector: (
                  <Stack marginLeft={4}>
                    <SimpleSelect<OrganizationUsageLimitName>
                      isSearchable={false}
                      options={[
                        {
                          label: intl.formatMessage({
                            id: "component.organization-usage-periods-table.selector-parallels-label",
                            defaultMessage: "parallels",
                          }),
                          value: "PETITION_SEND",
                        },
                        {
                          label: intl.formatMessage({
                            id: "component.organization-usage-periods-table.selector-signatures-label",
                            defaultMessage: "signatures",
                          }),
                          value: "SIGNATURIT_SHARED_APIKEY",
                        },
                      ]}
                      value={tableState.limitName}
                      onChange={(limitName) =>
                        onTableStateChange({ ...tableState, limitName: limitName! })
                      }
                    />
                  </Stack>
                ),
              }}
            />
          </HStack>
          {isDefined(items?.items?.[0]) ? (
            <Button
              onClick={onModifyCurrentPeriod}
              isDisabled={isDefined(items?.items[0]?.periodEndDate)}
            >
              <FormattedMessage
                id="component.organization-usage-periods-table.modify-ongoing-period-button"
                defaultMessage="Modify ongoing period"
              />
            </Button>
          ) : null}
        </Flex>
      }
    />
  );
}

OrganizationUsagePeriodsTable.fragments = {
  get OrganizationUsageLimit() {
    return gql`
      fragment OrganizationUsagePeriodsTable_OrganizationUsageLimit on OrganizationUsageLimit {
        id
        used
        limit
        period
        periodStartDate
        periodEndDate
      }
    `;
  },
  get OrganizationUsageLimitPagination() {
    return gql`
      fragment OrganizationUsagePeriodsTable_OrganizationUsageLimitPagination on OrganizationUsageLimitPagination {
        totalCount
        items {
          ...OrganizationUsagePeriodsTable_OrganizationUsageLimit
        }
      }
      ${this.OrganizationUsageLimit}
    `;
  },
};

AdminOrganizationsSubscriptions.fragments = {
  get Organization() {
    return gql`
      fragment AdminOrganizationsSubscriptions_Organization on Organization {
        id
        ...AdminOrganizationsLayout_Organization
        activeUserCount
        usageDetails
        petitionsSubscriptionEndDate: subscriptionEndDate(limitName: PETITION_SEND)
        signaturitSubscriptionEndDate: subscriptionEndDate(limitName: SIGNATURIT_SHARED_APIKEY)
        petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
          ...UpdateOrganizationUsageDetailsDialog_OrganizationUsageLimit
        }
        signaturesPeriod: currentUsagePeriod(limitName: SIGNATURIT_SHARED_APIKEY) {
          ...UpdateOrganizationUsageDetailsDialog_OrganizationUsageLimit
        }
      }
      ${AdminOrganizationsLayout.fragments.Organization}
      ${UpdateOrganizationUsageDetailsDialog.fragments.OrganizationUsageLimit}
    `;
  },
};

const _queries = [
  gql`
    query AdminOrganizationsSubscriptions_query($id: GID!) {
      ...AdminOrganizationsLayout_Query
      organization(id: $id) {
        ...AdminOrganizationsSubscriptions_Organization
      }
    }
    ${AdminOrganizationsLayout.fragments.Query}
    ${AdminOrganizationsSubscriptions.fragments.Organization}
  `,
  gql`
    query AdminOrganizationsSubscriptions_organizationUsagePeriodsQuery(
      $orgId: GID!
      $limit: Int
      $offset: Int
      $limitName: OrganizationUsageLimitName!
    ) {
      organization(id: $orgId) {
        id
        usagePeriods(limitName: $limitName, limit: $limit, offset: $offset) {
          ...OrganizationUsagePeriodsTable_OrganizationUsageLimitPagination
          items {
            ...UpdateOrganizationCurrentUsagePeriodDialog_OrganizationUsageLimit
          }
        }
        petitionsPeriod: currentUsagePeriod(limitName: PETITION_SEND) {
          ...UpdateOrganizationCurrentUsagePeriodDialog_OrganizationUsageLimit
          cycleNumber
        }
        signaturesPeriod: currentUsagePeriod(limitName: SIGNATURIT_SHARED_APIKEY) {
          ...UpdateOrganizationCurrentUsagePeriodDialog_OrganizationUsageLimit
          cycleNumber
        }
      }
    }
    ${OrganizationUsagePeriodsTable.fragments.OrganizationUsageLimitPagination}
    ${UpdateOrganizationCurrentUsagePeriodDialog.fragments.OrganizationUsageLimit}
  `,
];

const _mutations = [
  gql`
    mutation AdminOrganizationsSubscriptions_updateOrganizationUserLimit(
      $orgId: GID!
      $limit: Int!
    ) {
      updateOrganizationUserLimit(orgId: $orgId, limit: $limit) {
        ...AdminOrganizationsSubscriptions_Organization
      }
    }
    ${AdminOrganizationsSubscriptions.fragments.Organization}
  `,
  gql`
    mutation AdminOrganizationsSubscriptions_updateOrganizationUsageDetails(
      $orgId: GID!
      $limit: Int!
      $limitName: OrganizationUsageLimitName!
      $duration: Duration!
      $startNewPeriod: Boolean!
      $renewalCycles: Int!
    ) {
      updateOrganizationUsageDetails(
        orgId: $orgId
        limit: $limit
        limitName: $limitName
        duration: $duration
        startNewPeriod: $startNewPeriod
        renewalCycles: $renewalCycles
      ) {
        ...AdminOrganizationsSubscriptions_Organization
      }
    }
    ${AdminOrganizationsSubscriptions.fragments.Organization}
  `,
  gql`
    mutation AdminOrganizationsSubscriptions_shareSignaturitApiKey(
      $orgId: GID!
      $limit: Int!
      $duration: Duration!
    ) {
      shareSignaturitApiKey(orgId: $orgId, limit: $limit, duration: $duration) {
        ...AdminOrganizationsSubscriptions_Organization
      }
    }
    ${AdminOrganizationsSubscriptions.fragments.Organization}
  `,
  gql`
    mutation AdminOrganizationsSubscriptions_modifyCurrentUsagePeriod(
      $orgId: GID!
      $limitName: OrganizationUsageLimitName!
      $newLimit: Int!
    ) {
      modifyCurrentUsagePeriod(orgId: $orgId, limitName: $limitName, newLimit: $newLimit) {
        ...AdminOrganizationsSubscriptions_Organization
      }
    }
    ${AdminOrganizationsSubscriptions.fragments.Organization}
  `,
];

AdminOrganizationsSubscriptions.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await fetchQuery(AdminOrganizationsSubscriptions_queryDocument, {
    variables: { id: query.organizationId as string },
  });
  return { organizationId: query.organizationId as string };
};

export default compose(
  withSuperAdminAccess,
  withDialogs,
  withApolloData,
)(AdminOrganizationsSubscriptions);
